import { NextResponse } from "next/server";
import type { ApiResponse } from "@/lib/interface/apiInterface";
import { weekdays } from "./constant";
import { toPng } from "html-to-image";

export function scrollToPosition(
  y?: number,
  smooth: boolean = true,
  elementId?: string,
  offset: number = 0, // khoảng cách với
  delay: number = 0
) {
  if (typeof window === "undefined") return;

  const behavior = smooth ? "smooth" : "auto";

  // Nếu truyền ID → ưu tiên scroll tới element theo offset
  const runScroll = () => {
    // Nếu truyền ID → ưu tiên scroll tới element
    if (elementId) {
      const el = document.getElementById(elementId);
      if (el) {
        const rect = el.getBoundingClientRect();
        const absoluteY = rect.top + window.scrollY;

        window.scrollTo({
          top: Math.max(0, absoluteY - offset),
          behavior,
        });
        return;
      }
    }

    // fallback → scroll theo y
    window.scrollTo({
      top: (y ?? 0) - offset,
      behavior,
    });
  };

  // nếu delay > 0 → chờ xong rồi scroll
  if (delay > 0) {
    setTimeout(runScroll, delay);
  } else {
    runScroll();
  }
}

export function successResponse<T>(data?: T, message?: string, status = 200) {
  return NextResponse.json<ApiResponse<T>>(
    { success: true, message, data },
    { status }
  );
}

export function errorResponse(message: string, status = 400, error?: string) {
  return NextResponse.json<ApiResponse<null>>(
    { success: false, message, error },
    { status }
  );
}

/**
 * Tính tuổi từ ngày sinh (yyyy-mm-dd hoặc Date object)
 * Trả về số tuổi (number), hoặc null nếu ngày sinh không hợp lệ.
 */
export function computeAge(birth: string | Date): number | null {
  try {
    const date = birth instanceof Date ? birth : new Date(birth);
    if (isNaN(date.getTime())) return null; // invalid date

    const today = new Date();
    let age = today.getFullYear() - date.getFullYear();

    const monthDiff = today.getMonth() - date.getMonth();
    const dayDiff = today.getDate() - date.getDate();

    // Nếu chưa tới ngày sinh năm nay → trừ 1 tuổi
    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
      age--;
    }

    return age >= 0 ? age : null;
  } catch {
    return null;
  }
}

// format date từ db để hiển thị
export function formatDateWithDay(isoString: Date) {
  const date = new Date(isoString);

  const day = weekdays[date.getDay()];
  const dayNum = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();

  return `${day}, ${dayNum}/${month}/${year}`;
}

export function numberToLetter(n: number) {
  return String.fromCharCode(65 + n);
}

// kiểm tra lúc đặt ghế
// col được đánh số từ 1 và bỏ qua khoảng trống
export function isSingleGap(
  rowSeats: Array<{ seat_column: number; status: number; selected?: boolean }>,
  col: number,
  aside: []
) {
  // console.log("Trước rowSeats", rowSeats);
  // console.log("Trước col", col);

  // Chuẩn hóa seats: booked = true nếu từ DB có status=1 hoặc đang được chọn
  let seats = [...rowSeats]
    .sort((a, b) => a.seat_column - b.seat_column)
    .map((s) => ({
      col: s.seat_column,
      booked: s.status === 1 || s.selected === true,
    }));

  // điều chỉnh vị trí col khi có khoảng trống
  if (aside.length > 0) {
    // Sort aside theo gap_index để cộng chính xác
    const sortedAside = [...aside].sort((a, b) => a.gap_index - b.gap_index);

    sortedAside.forEach((gap) => {
      // tăng col dc chọn
      if (col >= gap.gap_index) col += gap.gap_width;
      // tăng col ds ghế
      seats = seats.map((seat) => {
        if (seat.col >= gap.gap_index) {
          return { ...seat, col: seat.col + gap.gap_width };
        }
        return seat;
      });
    });
  }
  console.log("Sau rowSeats", seats);
  console.log("Sau col", col);
  console.log("aside", aside);
  const get = (c: number) => seats.find((s) => s.col === c);

  // chống ghế sát trái
  const minCol = seats[0].col;
  if (col === minCol + 1 && !get(minCol)?.booked && !get(minCol + 2)?.booked) {
    // console.log("SÁT TRÁI");
    return true;
  }
  // sát phải
  const maxCol = seats[seats.length - 1].col;
  if (col === maxCol - 1 && !get(maxCol)?.booked && !get(maxCol - 2)?.booked) {
    // console.log("SÁT PHẢI");
    return true;
  }

  const left = get(col - 1);
  const right = get(col + 1);
  const left2 = get(col - 2);
  const right2 = get(col + 2);
  const left3 = get(col - 3);
  const right3 = get(col + 3);

  // ===== CHỐNG TRỐNG GHẾ SÁT LỐI ĐI =====
  for (const gap of aside) {
    const leftOfAisle = gap.gap_index - 1 + gap.gap_width - 1;
    const rightOfAisle = gap.gap_index - 1 + gap.gap_width + 1;
    console.log("l", leftOfAisle);
    console.log("r", rightOfAisle);
    const leftSeat = get(leftOfAisle);
    const rightSeat = get(rightOfAisle);

    // chọn ghế làm trống ghế sát lối đi bên trái
    if (col === leftOfAisle - 1 && leftSeat && !leftSeat.booked) {
      console.log("TRỐNG GHẾ SÁT LỐI ĐI (BÊN TRÁI)");
      return true;
    }

    // chọn ghế làm trống ghế sát lối đi bên phải
    if (col === rightOfAisle + 1 && rightSeat && !rightSeat.booked) {
      console.log("TRỐNG GHẾ SÁT LỐI ĐI (BÊN PHẢI)");
      return true;
    }
  }

  // hàng còn đúng 3 ghế liên tiếp
  if (left && right && !right.booked && !left.booked && !left2 && !right2) {
    // console.log("CÒN ĐÚNG 3 GHẾ LIÊN TIẾP");
    return true;
  }

  // lối đi bên phải
  // if (left && !left.booked && !left2 && left3) {
  //   console.log("LỐI ĐI BÊN PHẢI");
  //   return true;
  // }

  // lối đi nằm bên trái
  // if (right && !right.booked && !right2 && right3) {
  //   console.log("LỐI ĐI BÊN TRÁI");
  //   return true;
  // }

  if (left && !left.booked && left2?.booked) {
    // RULE 1: CHỐNG LẺ 1 GHẾ
    console.log("CHỐNG LẺ 1");
    return true;
  }
  if (right && !right.booked && right2?.booked) {
    return true;
  }

  return false;
}

// kiểm tra lúc bỏ ghế
export function isSingleGapRemove(
  rowSeats: Array<{ seat_column: number; status: number; selected?: boolean }>,
  col: number
): boolean {
  // 1. Chuẩn hóa và sắp xếp theo cột
  const seatsSorted = [...rowSeats].sort(
    (a, b) => a.seat_column - b.seat_column
  );

  // Bản đồ col -> index trong mảng đã sắp xếp
  const idxByCol = new Map<number, number>();
  seatsSorted.forEach((s, i) => idxByCol.set(s.seat_column, i));

  // Nếu col không tồn tại trong dãy ghế => không có gì để kiểm tra
  if (!idxByCol.has(col)) return false;

  const idxToRemove = idxByCol.get(col)!;

  // 2. Nếu ghế đã được DB đặt (status === 1) => đây không phải là "bỏ chọn của user"
  // caller nên xử lý riêng (không thể bỏ chọn ghế đã DB đặt). Ở đây trả false (không phát sinh single-gap bằng thao tác bỏ chọn),
  // vì hành động bỏ chọn về mặt nghiệp vụ không hợp lệ (blocked) — caller xử lý permission.
  const seatOrig = seatsSorted[idxToRemove];
  if (seatOrig.status === 1) {
    // Không phải lỗi "tạo gap" do remove; nhưng thực tế bỏ chọn là không hợp lệ vì DB đã đặt.
    return false;
  }

  // 3. Mô phỏng trạng thái sau khi BỎ chọn ghế `col`:
  // booked = true nếu status === 1 (DB đặt) hoặc selected === true (user đang chọn),
  // nhưng với ghế col, ta giả lập selected = false (đã bỏ chọn).
  const seats = seatsSorted.map((s, i) => ({
    col: s.seat_column,
    booked: s.status === 1 || (s.selected === true && i !== idxToRemove),
  }));

  const n = seats.length;

  // 4. Tìm tất cả các single-gap sau khi mô phỏng
  // single-gap: vị trí i có booked === false, và hai bên i-1 & i+1 tồn tại và đều booked === true
  const singleGaps: number[] = [];
  for (let i = 0; i < n; i++) {
    const cur = seats[i];
    if (cur.booked) continue;
    const left = i - 1 >= 0 ? seats[i - 1] : undefined;
    const right = i + 1 < n ? seats[i + 1] : undefined;

    if (left && right && left.booked && right.booked) {
      singleGaps.push(i);
    }
  }

  if (singleGaps.length === 0) {
    // Không có single-gap => bỏ chọn hợp lệ
    return false;
  }

  // 5. Nếu có single-gap, kiểm tra vị trí: nếu tất cả đều ở mép (edge: i === 0 hoặc i === n-1)
  // thì cho phép (tức trả false). Nếu có ít nhất 1 gap ở giữa (0 < i < n-1) => không hợp lệ.
  const allAtEdges = singleGaps.every((i) => i === 0 || i === n - 1);
  if (allAtEdges) {
    // Tạo gap nhưng chỉ ở mép => chấp nhận (ưu tiên gap sát bên trái/phải)
    return false;
  }

  // 6. Nếu tới đây có ít nhất 1 gap ở giữa => không hợp lệ
  return true;
}

export function getCurrentDateTime() {
  const now = new Date();
  const pad = (n: number) => (n < 10 ? `0${n}` : n);

  return (
    now.getFullYear() +
    "-" +
    pad(now.getMonth() + 1) +
    "-" +
    pad(now.getDate()) +
    " " +
    pad(now.getHours()) +
    ":" +
    pad(now.getMinutes()) +
    ":" +
    pad(now.getSeconds())
  );
}

export function getDateFromOffset(offset: number) {
  const today = new Date();
  today.setDate(today.getDate() + offset);

  const dayName = weekdays[today.getDay()];

  const date = today.getDate(); // ngày
  const month = today.getMonth() + 1; // tháng (0-based)
  const year = today.getFullYear();

  const dateOnly = `${year}-${month.toString().padStart(2, "0")}-${date
    .toString()
    .padStart(2, "0")}`;

  return {
    dayName, // tên thứ
    date, // ngày
    month, // tháng
    year, // năm
    jsDate: dateOnly,
    full: `${dayName}, ${date}/${month}/${year}`, // chuỗi đầy đủ
  };
}

export function toMySQLDate(dateValue: any): string | null {
  if (!dateValue && dateValue !== 0) return null;

  // 1) Nếu là string (ISO hoặc "YYYY-MM-DDTHH:..")
  if (typeof dateValue === "string") {
    // Nếu có 'T' (ISO), lấy phần trước T, ngược lại assume string đã là YYYY-MM-DD
    if (dateValue.includes("T")) return dateValue.split("T")[0];
    // Nếu dạng dd/mm/yyyy (ví dụ "25/11/2025"), try convert
    if (dateValue.includes("/")) {
      const parts = dateValue.split("/");
      if (parts.length === 3) {
        // parts: ["25","11","2025"]
        return `${parts[2].padStart(4, "0")}-${parts[1].padStart(
          2,
          "0"
        )}-${parts[0].padStart(2, "0")}`;
      }
    }
    // assume already YYYY-MM-DD
    return dateValue;
  }

  // 2) Nếu là Date object
  if (dateValue instanceof Date && !Number.isNaN(dateValue.getTime())) {
    return dateValue.toISOString().split("T")[0];
  }

  // 3) Nếu là number timestamp (ms)
  if (typeof dateValue === "number") {
    const d = new Date(dateValue);
    if (!Number.isNaN(d.getTime())) return d.toISOString().split("T")[0];
  }

  // 4) Nếu là object custom (như của bạn)
  if (typeof dateValue === "object") {
    // ưu tiên trường jsDate nếu có
    if (typeof dateValue.jsDate === "string") {
      return toMySQLDate(dateValue.jsDate);
    }
    // nếu có year/month/date
    if (
      typeof dateValue.year === "number" &&
      typeof dateValue.month === "number" &&
      typeof dateValue.date === "number"
    ) {
      const y = String(dateValue.year).padStart(4, "0");
      const m = String(dateValue.month).padStart(2, "0");
      const dd = String(dateValue.date).padStart(2, "0");
      return `${y}-${m}-${dd}`;
    }
  }

  // fallback
  console.warn("toMySQLDate: unsupported date format:", dateValue);
  return null;
}

export function parseDateFromYMD(ymd: string): Date {
  // ymd expected "YYYY-MM-DD"
  const [y, m, d] = ymd.split("-").map((s) => Number(s));
  // monthIndex = month - 1
  return new Date(y, m - 1, d);
}

// nhận 1 date trả về 1 số
export function getDayOffset(dateString: Date) {
  const target = new Date(dateString);
  const today = new Date();

  // đưa cả hai về 00:00 để tính ngày cho chuẩn
  target.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  const diffMs = target.getTime() - today.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  return diffDays; // số ngày lệch: 0, 1, 2,...
}

// tính toán % hoàn tiền
export function getRefundPercent(
  date: Date,
  time: string,
  vip: number | string
) {
  // Ghép date + time thành datetime chuẩn
  const [hour, minute] = time.split(":").map(Number);
  const showtime = new Date(date);
  showtime.setHours(hour, minute, 0, 0);

  const now = new Date();
  const diffMs = showtime.getTime() - now.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  console.log(date, time, vip);
  console.log(now, diffHours);

  if (vip === 0) {
    if (diffHours >= 24) return 100;
    if (diffHours >= 12) return 95;
    if (diffHours >= 6) return 90;
    if (diffHours >= 3) return 80;
  } else if (vip === 1) {
    if (diffHours >= 12) return 100;
    if (diffHours >= 6) return 95;
    if (diffHours >= 3) return 85;
  }

  return 0; // dưới 3 giờ không cho hủy
}

//  chuyển bookingData sang ticket
export function convertToTickets(booking) {
  const seats = booking.seats || [];
  const ticketTypes = booking.ticket_type || [];
  const foods = booking.food_drink || [];

  const tickets = seats.map((seat, index) => {
    // Gán ticket_type theo thứ tự (hoặc random cũng được)
    const tt = ticketTypes[index % ticketTypes.length];

    return {
      seat_id: seat.seat_id,
      ticket_type_id: tt.ticket_type_id,
      price: Number(tt.price_final),
      total_price: Number(tt.price_final),
      food: [], // sẽ gắn food sau
    };
  });

  // Gắn toàn bộ foods vào vé đầu tiên (nếu có)
  if (foods.length > 0 && tickets.length > 0) {
    tickets[0].food = foods.map((item) => {
      const key = Object.keys(item)[0]; // "Bắp M", "Bắp L"
      const value = item[key]; // { quantity, price, food_id }

      return {
        food_id: value.food_id,
        quantity: value.quantity,
      };
    });
  }

  return tickets;
}

// helper: chuyển HTML element thành PNG và tải về (dùng html-to-image)
export async function downloadElementAsImage(
  el: HTMLElement,
  filename = "ticket.png"
) {
  try {
    if (!el) throw new Error("Element không tồn tại!");

    // chờ font load để tránh lỗi font fallback khi xuất ảnh
    if (document.fonts && typeof document.fonts.ready?.then === "function") {
      try {
        await document.fonts.ready;
      } catch {}
    }

    const rect = el.getBoundingClientRect();

    const options: any = {
      quality: 1,
      width: Math.ceil(rect.width),
      height: Math.ceil(rect.height),
      style: {
        "box-sizing": "border-box",
        "-webkit-font-smoothing": "antialiased",
        "-moz-osx-font-smoothing": "grayscale",
      },
      // nếu cần lọc node: filter: (node) => true
    };

    // toPng trả về dataURL
    const dataUrl = await toPng(el, options);

    // tạo link tải
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  } catch (err) {
    console.error("html-to-image error:", err);
    alert("Không thể tạo ảnh vé. Kiểm tra console để biết chi tiết.");
  }
}

export const fmtCurrency = (value) => {
  if (value == null) return "-";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value);
};

// lấy giá (hiển thị bảng)
export const getPrice = (prices, time_from, is_holiday, ticket_type_id) => {
  const item = prices.find(
    (p) =>
      p.time_from === time_from &&
      p.is_holiday === is_holiday &&
      p.ticket_type_id === ticket_type_id
  );
  return item ? Number(item.price).toLocaleString() : "-";
};
