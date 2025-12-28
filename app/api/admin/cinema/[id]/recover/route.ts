import { db } from "@/lib/db";
import { errorResponse, successResponse } from "@/lib/function";

// cập nhật rạp
export async function PUT(req: Request, { params }: { params: string }) {
  try {
    const { id } = await params;

    await db.query(
      `UPDATE cinemas 
      SET status = 1 
      WHERE cinema_id = ?`,
      [id]
    );

    return successResponse({}, "Rạp đã hoạt động trở lại", 200);
  } catch (error) {
    console.error(error);
    return errorResponse(
      "Xảy ra lỗi, rạp chưa hoạt động lại",
      500,
      error.message
    );
  }
}
