import { NextResponse } from "next/server";
import type { ApiResponse } from "@/lib/interface/apiInterface";
import { weekdays } from "./constant";

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
          top: absoluteY - offset,
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

export function isSingleGap(
  rowSeats: Array<{ seat_column: number; status: number; selected?: boolean }>,
  col: number
) {
  // Chuẩn hóa seats: booked = true nếu từ DB có status=1 hoặc đang được chọn
  const seats = [...rowSeats]
    .sort((a, b) => a.seat_column - b.seat_column)
    .map((s) => ({
      col: s.seat_column,
      booked: s.status === 1 || s.selected === true,
    }));
  const get = (c: number) => seats.find((s) => s.col === c);

  // chống ghế sát trái, sát phải
  if (col === 1 && !get(0)?.booked && !get(2)?.booked) return true;
  if (
    col === rowSeats.length - 2 &&
    !get(rowSeats.length - 1)?.booked &&
    !get(rowSeats.length - 3)?.booked
  ) {
    return true;
  }

  const left = get(col - 1);
  const right = get(col + 1);
  const left2 = get(col - 2);
  const right2 = get(col + 2);

  // RULE 1: CHỐNG LẺ 1 GHẾ
  if (left && !left.booked && left2?.booked) return true;
  if (right && !right.booked && right2?.booked) return true;

  return false;
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
        return `${parts[2].padStart(4, "0")}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
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
