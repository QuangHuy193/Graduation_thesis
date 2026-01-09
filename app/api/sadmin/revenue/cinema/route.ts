import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/function";

// thống kê các doanh thu liên quan rạp theo năm/tháng (cao nhất, thấp nhất)
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const month = url.searchParams.get("month");
    const year = url.searchParams.get("year");
    console.log(month, year);
    if (year) {
      // theo tháng
      if (month) {
        const [max] = await db.query(
          `SELECT * FROM (
          SELECT c.cinema_id, CONCAT(c.name, ' (', c.province, ')') AS name,
          COALESCE(SUM(p.amount), 0) - COALESCE(SUM(r.amount), 0) AS revenue
          FROM cinemas c 
          LEFT JOIN rooms ro ON ro.cinema_id = c.cinema_id
          LEFT JOIN showtime s ON s.room_id = ro.room_id
          LEFT JOIN booking b ON b.showtime_id = s.showtime_id
          LEFT JOIN payment p ON p.booking_id = b.booking_id  
          LEFT JOIN refund r ON r.booking_id = b.booking_id
          WHERE MONTH(p.payment_time) = ? AND YEAR(p.payment_time) = ?
          GROUP BY c.cinema_id, c.name ) t
          HAVING revenue > 0
          ORDER BY revenue DESC
          LIMIT 1`,
          [month, year]
        );

        const [min] = await db.query(
          `SELECT * FROM (
          SELECT c.cinema_id, CONCAT(c.name, ' (', c.province, ')') AS name, 
          COALESCE(SUM(p.amount), 0) - COALESCE(SUM(r.amount), 0) AS revenue
          FROM cinemas c 
          LEFT JOIN rooms ro ON ro.cinema_id = c.cinema_id
          LEFT JOIN showtime s ON s.room_id = ro.room_id
          LEFT JOIN booking b ON b.showtime_id = s.showtime_id
          LEFT JOIN payment p ON p.booking_id = b.booking_id  
          LEFT JOIN refund r ON r.booking_id = b.booking_id
          WHERE MONTH(p.payment_time) = ? AND YEAR(p.payment_time) = ?
          GROUP BY c.cinema_id, c.name ) t
          HAVING revenue > 0
          ORDER BY revenue ASC
          LIMIT 1`,
          [month, year]
        );

        return successResponse(
          {
            max: max[0] || null,
            min: min[0] || null,
          },
          "success",
          200
        );
      }
      // theo năm
      else {
        const [max] = await db.query(
          `SELECT * FROM (
          SELECT c.cinema_id, CONCAT(c.name, ' (', c.province, ')') AS name, 
          COALESCE(SUM(p.amount), 0) - COALESCE(SUM(r.amount), 0) AS revenue
          FROM cinemas c 
          LEFT JOIN rooms ro ON ro.cinema_id = c.cinema_id
          LEFT JOIN showtime s ON s.room_id = ro.room_id
          LEFT JOIN booking b ON b.showtime_id = s.showtime_id
          LEFT JOIN payment p ON p.booking_id = b.booking_id  
          LEFT JOIN refund r ON r.booking_id = b.booking_id
          WHERE YEAR(p.payment_time) = ?
          GROUP BY c.cinema_id, c.name ) t
          HAVING revenue > 0
          ORDER BY revenue DESC
          LIMIT 1`,
          [year]
        );

        const [min] = await db.query(
          `SELECT * FROM (
          SELECT c.cinema_id, CONCAT(c.name, ' (', c.province, ')') AS name, 
          COALESCE(SUM(p.amount), 0) - COALESCE(SUM(r.amount), 0) AS revenue
          FROM cinemas c 
          LEFT JOIN rooms ro ON ro.cinema_id = c.cinema_id
          LEFT JOIN showtime s ON s.room_id = ro.room_id
          LEFT JOIN booking b ON b.showtime_id = s.showtime_id
          LEFT JOIN payment p ON p.booking_id = b.booking_id  
          LEFT JOIN refund r ON r.booking_id = b.booking_id
          WHERE YEAR(p.payment_time) = ?
          GROUP BY c.cinema_id, c.name ) t
          HAVING revenue > 0
          ORDER BY revenue ASC
          LIMIT 1`,
          [year]
        );

        return successResponse(
          {
            max: max[0] || null,
            min: min[0] || null,
          },
          "success",
          200
        );
      }
    }
    return successResponse([], "success", 200);
  } catch (error) {
    console.error(error);
    return errorResponse("Lấy thông tin doanh thu rạp thất bại", 500);
  }
}
