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
      `SELECT t.ticket_id, t.qr_code, st.date as showtime_date, s.seat_row, s.seat_column, r.name, ms.start_time
      , t.total_price, f.name as food_name, fo.quantity
      FROM ticket t
      JOIN booking b ON b.booking_id = t.booking_id
      JOIN showtime st ON st.showtime_id = b.showtime_id
      JOIN rooms r ON st.room_id = r.room_id
      JOIN movie_screenings ms ON ms.movie_screen_id = st.movie_screen_id
      JOIN seats s ON s.seat_id = t.seat_id
      JOIN food_order fo ON fo.ticket_id = t.ticket_id
      JOIN foods f ON f.food_id = fo.food_id 
      WHERE t.booking_id = ?`,
      [booking_id]
    );

    const ticketsMap = {};

    for (const row of rows) {
      if (!ticketsMap[row.ticket_id]) {
        ticketsMap[row.ticket_id] = {
          ticket_id: row.ticket_id,
          qr_code: row.qr_code,
          showtime_date: row.showtime_date,
          seat_row: row.seat_row,
          seat_column: row.seat_column,
          room_name: row.name,
          start_time: row.start_time,
          total_price: row.total_price,
          foods: [],
        };
      }
      // Push food vào mảng
      ticketsMap[row.ticket_id].foods.push({
        food_name: row.food_name,
        quantity: row.quantity,
      });
    }

    const tickets = Object.values(ticketsMap);

    return successResponse(tickets, "success", 200);
  } catch (error) {
    console.error(error);
    return errorResponse("Lấy danh sách vé thất bại", 500);
  }
}
