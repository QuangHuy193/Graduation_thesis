import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/function";

export async function DELETE(req: Request, { params }: { params: string }) {
  try {
    const { id } = await params;
    await db.execute(`UPDATE rooms SET status = 0 WHERE room_id = ?`, [id]);
    return successResponse([], "Chuyển trạng thái phòng thành công", 200);
  } catch (error) {
    return errorResponse("Xóa phòng lỗi", 400);
  }
}
