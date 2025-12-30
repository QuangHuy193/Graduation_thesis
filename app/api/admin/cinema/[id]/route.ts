import { db } from "@/lib/db";
import { errorResponse, successResponse } from "@/lib/function";

// cập nhật rạp
export async function PUT(req: Request, { params }: { params: string }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { name, specific_address, ward, province, price_base } = body;

    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT cinema_id FROM cinemas 
      WHERE name = ? AND status = 1 AND cinema_id <> ? LIMIT 1`,
      [name, id]
    );

    if (rows.length > 0) {
      return errorResponse("Tên rạp đã tồn tại", 409);
    }

    await db.query(
      `UPDATE cinemas 
      SET name = ?, specific_address = ?, ward = ?, province = ?, price_base = ? 
      WHERE cinema_id = ?`,
      [name, specific_address, ward, province, price_base, id]
    );

    return successResponse({}, "Cập nhật rạp thành công", 200);
  } catch (error) {
    console.error(error);
    return errorResponse("Cập nhật rạp thất bại", 500, error.message);
  }
}

// xóa rạp
export async function DELETE(req: Request, { params }: { params: string }) {
  try {
    const { id } = await params;
    const body = await req.json();
    // 0 xóa bình thường
    // 1 có showtime
    // 2 có showtime, booking
    const { type } = body;

    if (type === 1 || type === 2) {
      if (type === 2) {
        const connection = await db.getConnection();
        await connection.beginTransaction();

        // lấy tất cả booking thuộc phòng
        const [bookings]: any = await connection.query(
          `SELECT b.booking_id, b.total_price
          FROM booking b
          JOIN showtime s ON b.showtime_id = s.showtime_id
          WHERE r.cinema_id = ? AND b.status = 1`,
          [id]
        );

        for (const booking of bookings) {
          // TODO gọi api hoàn tiền
        }

        await connection.commit();
      }

      // hủy lịch chiếu
      await db.query(
        `UPDATE showtime s
        JOIN rooms r ON s.room_id = r.room_id
        WHERE r.cinema_id = ?`,
        [id]
      );
    }

    // hủy rạp bình thường
    await db.query(
      `UPDATE cinemas 
      SET status = 0 
      WHERE cinema_id = ?`,
      [id]
    );
    return successResponse({}, "Rạp đã ngưng hoạt động", 200);
  } catch (error) {
    console.error(error);
    return errorResponse(
      "Có lỗi xảy ra, rạp không thể ngừng hoạt động",
      500,
      error.message
    );
  }
}
