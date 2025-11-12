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