import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/function";

// lấy danh sách ghế theo id phòng và id suất chiếu và date
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const room = Number(searchParams.get("room"));
  const showtime = Number(searchParams.get("showtime"));
  const day = Number(searchParams.get("day"));

  // Tính ngày đích
  const target = new Date();
  target.setDate(target.getDate() + day);

  // Format YYYY-MM-DD
  const date = target.toISOString().split("T")[0];

  try {
    const [rows] = await db.query(
      `SELECT s.seat_id, s.seat_row, s.seat_column, ss.status
      FROM seats s
      JOIN showtime_seat ss on ss.seat_id = s.seat_id
      WHERE s.room_id = ? AND ss.showtime_id = ? AND ss.date = ?`,
      [room, showtime, date]
    );

    return successResponse(rows, "success", 200);
  } catch (error) {
    console.error(error);
    return errorResponse("Lấy danh sách ghế thất bại", 500);
  }
}
