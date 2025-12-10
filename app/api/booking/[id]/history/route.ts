import { db } from "@/lib/db";
import { errorResponse, successResponse } from "@/lib/function";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { id } = await params;

  try {
    const [rows]: any = await db.execute(
      `SELECT 
        b.booking_id, m.name AS movie, c.name AS cinema, b.booking_time, 
        b.total_price AS booking_total, b.status, 
        s.date AS showtime_date, ms.start_time,
        t.ticket_id, t.total_price AS ticket_total, t.qr_code, t.status as ticket_status,
        se.seat_row, se.seat_column, se.seat_id, 
        f.name AS food_name, fo.quantity
      FROM users u 
      JOIN booking b ON b.user_id = u.user_id 
      JOIN showtime s ON s.showtime_id = b.showtime_id
      JOIN movies m ON m.movie_id = s.movie_id
      JOIN rooms r ON r.room_id = s.room_id
      JOIN cinemas c ON c.cinema_id = r.cinema_id
      JOIN ticket t ON t.booking_id = b.booking_id
      JOIN seats se ON se.seat_id = t.seat_id
      JOIN movie_screenings ms ON ms.movie_screen_id = s.movie_screen_id
      JOIN food_order fo ON fo.ticket_id = t.ticket_id
      JOIN foods f ON f.food_id = fo.food_id
      WHERE u.user_id = ?`,
      [id]
    );

    if (rows.length === 0) return successResponse([], "true", 200);

    // --- Gom thành nhiều booking ---
    const bookingMap = new Map();

    rows.forEach((row: any) => {
      // Nếu booking chưa tồn tại → tạo mới
      if (!bookingMap.has(row.booking_id)) {
        bookingMap.set(row.booking_id, {
          booking_id: row.booking_id,
          movie: row.movie,
          cinema: row.cinema,
          booking_time: row.booking_time,
          total_price: row.booking_total,
          status: row.status,
          showtime_date: row.showtime_date,
          start_time: row.start_time,
          tickets: [],
          _ticketMap: new Map(), // dùng nội bộ
        });
      }

      const booking = bookingMap.get(row.booking_id);

      // Nếu ticket chưa tồn tại trong booking → tạo mới
      if (!booking._ticketMap.has(row.ticket_id)) {
        booking._ticketMap.set(row.ticket_id, {
          ticket_id: row.ticket_id,
          qr_code: row.qr_code,
          total_price: row.ticket_total,
          status: row.ticket_status,
          seat: {
            seat_id: row.seat_id,
            seat_row: row.seat_row,
            seat_column: row.seat_column,
          },
          foods: [],
        });
      }

      // Thêm food vào ticket
      booking._ticketMap.get(row.ticket_id).foods.push({
        food_name: row.food_name,
        quantity: row.quantity,
      });
    });

    // Chuyển Map → array và bỏ _ticketMap
    const bookings = Array.from(bookingMap.values()).map((b: any) => {
      b.tickets = Array.from(b._ticketMap.values());
      delete b._ticketMap;
      return b;
    });

    return successResponse(bookings, "true", 200);
  } catch (error) {
    console.log(error);
    return errorResponse("false", 400);
  }
}
