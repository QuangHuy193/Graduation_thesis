import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/function";

// xóa phòng
export async function DELETE(req: Request, { params }: { params: string }) {
  try {
    const { id } = await params;
    const body = await req.json();
    // type = 0: xóa bình thường (mặc định)
    // type = 1: xóa hủy lịch chiếu
    // type = 2: xóa hủy lịch hoàn tiền
    const { type } = body;

    if (type === undefined) {
      console.log("Thiếu type");
      return errorResponse("Xóa phòng lỗi", 400);
    }

    // có lịch chiếu chưa có booking
    if (type === 1) {
      await db.execute(`UPDATE rooms SET status = 0 WHERE room_id = ?`, [id]);
      await db.execute(`UPDATE showtime SET status = 0 WHERE room_id = ?`, [
        id,
      ]);
      return successResponse([], "Chuyển trạng thái phòng thành công", 200);
    }

    // chưa có lịch chiếu
    await db.execute(`UPDATE rooms SET status = 0 WHERE room_id = ?`, [id]);
    return successResponse([], "Chuyển trạng thái phòng thành công", 200);
  } catch (error) {
    return errorResponse("Xóa phòng lỗi", 400);
  }
}
