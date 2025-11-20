import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/function";

// lấy danh sách ghế theo id phòng và id suất chiếu
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const room = Number(searchParams.get("room"));
  const showtime = Number(searchParams.get("showtime"));

  try {
    const [rows] = await db.query(
      `SELECT seat_id, seat_row, seat_column, status FROM seats WHERE room_id = ? AND showtime_id = ?`,
      [room, showtime]
    );

    return successResponse(rows, "success", 200);
  } catch (error) {
    console.error(error);
    return errorResponse("Lấy danh sách ghế thất bại", 500);
  }
}
