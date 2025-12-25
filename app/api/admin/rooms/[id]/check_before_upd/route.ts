import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/function";

// kiểm tra trước khi cập nhật phòng
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;

    // KIỂM TRA LỊCH CHIẾU
    const [showtimes]: any = await db.query(
      `SELECT s.showtime_id
       FROM showtime s
       WHERE room_id = ? AND status = 1`,
      [id]
    );

    // Không có lịch chiếu
    if (showtimes.length === 0) {
      return successResponse(
        {
          case: "update",
        },
        "Phòng chưa có lịch chiếu, có thể cập nhật tất cả dữ liệu liệu",
        200
      );
    }

    // kiểm tra showtime có booking chưa
    const showtimeIds = showtimes.map((s) => s.showtime_id);

    const [booking]: any = await db.query(
      `SELECT EXISTS(
        SELECT 1 
        FROM booking 
        WHERE showtime_id IN (?)) AS hasBooking`,
      [showtimeIds]
    );

    // có booking
    if (booking[0].hasBooking === 1) {
      return successResponse(
        {
          case: "update_showtime_booking",
        },
        `Phòng có đã ${showtimes.length} lịch chiếu và đã có vé được đặt, nếu cập nhật các dữ liệu trừ tên sẽ phải hủy các đơn hàng liên quan và hoàn tiền cho khách hàng. Vẫn tiếp tục?`,
        200
      );
    }
    // không có booking
    else {
      return successResponse(
        {
          case: "update_showtime",
        },
        `Phòng có đã ${showtimes.length} lịch chiếu, nếu cập nhật các dữ liệu trừ tên sẽ thay đổi đến lịch chiếu, vẫn tiếp tục?`,
        200
      );
    }
  } catch (error) {
    console.error(error);
    return errorResponse("Kiểm tra phòng lỗi", 400);
  }
}
