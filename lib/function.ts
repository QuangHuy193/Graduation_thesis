import { NextResponse } from "next/server";
import type { ApiResponse } from "@/lib/interface/apiInterface";
import { weekdays } from "./constant";

export function scrollToPosition(
  y?: number,
  smooth: boolean = true,
  elementId?: string,
  offset: number = 0 // khoảng cách với top
) {
  if (typeof window === "undefined") return;

  const behavior = smooth ? "smooth" : "auto";

  // Nếu truyền ID → ưu tiên scroll tới element theo offset
  if (elementId) {
    const el = document.getElementById(elementId);
    if (el) {
      const rect = el.getBoundingClientRect();
      const absoluteY = rect.top + window.scrollY; // vị trí thật trên trang

      window.scrollTo({
        top: absoluteY - offset,
        behavior,
      });
      return;
    }
  }

  // fallback → scroll theo y như logic cũ
  window.scrollTo({
    top: (y ?? 0) - offset,
    behavior,
  });
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
