import { db } from "@/lib/db";
import { errorResponse, successResponse } from "@/lib/function";

// kiểm tra trước khi xóa rạp
export async function GET(req: Request, { params }: { params: string }) {
  try {
    const { id } = await params;

    const [showtimes] = await db.query(
      `SELECT COUNT(s.showtime_id) as count
      FROM showtime s
      JOIN rooms r ON r.room_id = s.room_id
      JOIN cinemas c ON c.cinema_id = r.cinema_id
      WHERE c.cinema_id = ? AND s.status = 1`,
      [id]
    );

    if (showtimes[0].count > 0) {
      const [bookings] = await db.query(
        `SELECT COUNT(b.booking_id) AS count
        FROM booking b
        JOIN showtime st ON st.showtime_id = b.showtime_id
        JOIN rooms r ON r.room_id = st.room_id
        JOIN cinemas c ON c.cinema_id = r.cinema_id
        WHERE c.cinema_id = ? AND st.status = 1 AND b.status = 1`,
        [id]
      );
      if (bookings[0].count === 0) {
        return successResponse(
          { isDelete: "delete_showtime" },
          `Rạp hiện đang có ${showtimes[0].count} lịch chiếu, tiếp tục sẽ hủy tất cả lịch chiếu?`,
          200
        );
      } else {
        return successResponse(
          { isDelete: "delete_showtime" },
          `Rạp hiện đang có ${showtimes[0].count} lịch chiếu và có tổng cộng ${bookings[0].count} đơn hàng, tiếp tục sẽ hủy tất cả lịch chiếu, đơn hàng và hoàn tiền 100% cho khách hàng?`,
          200
        );
      }
    } else {
      return successResponse(
        { isDelete: "delete" },
        "Rạp có thể ngừng hoạt động ngay",
        200
      );
    }
  } catch (error) {
    console.error(error);
    return errorResponse("Có lỗi xảy ra", 500, error.message);
  }
}
