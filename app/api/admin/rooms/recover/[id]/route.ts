import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/function";

export async function PUT(req: Request, { params }: { params: string }) {
  try {
    const { id } = await params;
    await db.execute(`UPDATE rooms SET status = 1 WHERE room_id = ?`, [id]);
    return successResponse([], "Chuyển trạng thái phòng thành công", 200);
  } catch (error) {
    return errorResponse("Chuyển trạng thái phòng lỗi", 400);
  }
}
