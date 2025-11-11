import { NextResponse } from "next/server";
import type { ApiResponse } from "@/lib/interface/apiInterface";

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
