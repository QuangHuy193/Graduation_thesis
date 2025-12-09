import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/function";

// lấy danh sách ghế theo booking
export async function GET(req: Request) {
  const url = new URL(req.url);
  const booking_id = url.searchParams.get("booking_id");

  if (!booking_id) {
    return errorResponse("Thiếu booking_id", 400);
  }

  try {
    const [rows] = await db.query(
      `SELECT t.ticket_id, t.qr_code, s.showtime_date, s.seat_row, s.seat_column, r.name, ms.start_time
      FROM ticket t
      JOIN booking b ON b.booking_id = t.booking_id
      JOIN showtime st ON st.showtime_id = b.showtime_id
      JOIN rooms r ON st.room_id = r.room_id
      JOIN movie_screenings ms ON ms.movie_screen_id = st.movie_screen_id
      JOIN seats s ON s.seat_id = t.seat_id
      WHERE t.booking_id = ?`,
      [booking_id]
    );

    return successResponse(rows, "success", 200);
  } catch (error) {
    console.error(error);
    return errorResponse("Lấy danh sách vé thất bại", 500);
  }
}
