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

export function successResponse<T>(data: T, message?: string, status = 200) {
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

export function isSingleGap(rowSeats, col: number) {
  // rowSeats: mảng ghế trong 1 hàng (có status + column)
  // col: ghế user muốn chọn (0-based)

  // tạo array trạng thái liên tục theo cột
  // 0 = trống, 1 = đã đặt hoặc đã chọn
  const seats = [...rowSeats]
    .sort((a, b) => Number(a.seat_column) - Number(b.seat_column))
    .map((s) => ({
      col: Number(s.seat_column),
      booked: s.status === 1 || s.selected === true,
    }));

  // check ghế 2 bên
  const left = seats.find((s) => s.col === col - 1);
  const right = seats.find((s) => s.col === col + 1);

  // check ghế 2 bên tiếp theo
  const left2 = seats.find((s) => s.col === col - 2);
  const right2 = seats.find((s) => s.col === col + 2);

  /***
   * Trường hợp tạo khoảng trống 1 ghế:
   * [ X ][ _ ][ YOU ]  -> không cho
   * [ YOU ][ _ ][ X ]  -> không cho
   */

  // tạo gap bên trái
  if (left && !left.booked && left2 && left2.booked) {
    return true;
  }

  // tạo gap bên phải
  if (right && !right.booked && right2 && right2.booked) {
    return true;
  }

  return false;
}
