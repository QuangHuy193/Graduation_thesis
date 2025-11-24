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
  console.log(rowSeats, col);
  // Chuẩn hóa seats: booked = true nếu từ DB có status=1 hoặc đang được chọn
  const seats = [...rowSeats]
    .sort((a, b) => a.seat_column - b.seat_column)
    .map((s) => ({
      col: s.seat_column,
      booked: s.status === 1 || s.selected === true,
    }));

  const get = (c: number) => seats.find((s) => s.col === c);

  const left = get(col - 1);
  const right = get(col + 1);
  const left2 = get(col - 2);
  const right2 = get(col + 2);

  // RULE 1: CHỐNG LẺ 1 GHẾ
  if (left && !left.booked && left2?.booked) return true;

  if (right && !right.booked && right2?.booked) return true;

  // RULE 2: KHÔNG CHO CHỌN 2 GHẾ GIỮA KHI CHUỖI CÒN 4 GHẾ TRỐNG
  let g1 = get(col - 1);
  let g2 = get(col);
  let g3 = get(col + 1);
  let g4 = get(col + 2);
  if (g4 === undefined) {
    g1 = get(col - 2);
    g2 = get(col - 1);
    g3 = get(col);
    g4 = get(col + 1);
  }

  // nếu đủ 4 ghế liên tiếp
  if (g1 && g2 && g3 && g4) {
    const allFourEmpty = !g1.booked && !g2.booked && !g3.booked && !g4.booked;

    if (allFourEmpty) {
      // vị trí giữa là col hoặc col+1
      if (col === g2.col || col === g3.col) {
        return true; // không cho chọn vì rơi vào 2 ghế giữa
      }
    }
  }

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
