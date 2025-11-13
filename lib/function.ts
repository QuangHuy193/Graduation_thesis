import { NextResponse } from "next/server";
import type { ApiResponse } from "@/lib/interface/apiInterface";


export function scrollToPosition(y?: number, smooth: boolean = true) {
  if (typeof window === "undefined") return; // tránh lỗi khi SSR

  window.scrollTo({
    top: y ?? 0,
    behavior: smooth ? "smooth" : "auto",
  });
}

export function successResponse<T>(
  data: T,
  message?: string,
  status = 200
) {
  return NextResponse.json<ApiResponse<T>>(
    { success: true, message, data },
    { status }
  );
}

export function errorResponse(
  message: string,
  status = 400,
  error?: string
) {
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
