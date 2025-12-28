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

    // TODO cập nhật price_fixed

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

    const [showtimes] = await db.query(
      `SELECT COUNT(s.showtime_id) 
      FROM showtime s
      JOIN rooms r ON r.room_id = s.room_id
      JOIN cinemas c ON c.cinema_id = r.cinema_id
      WHERE c.cinema_id = ?`,
      [id]
    );

    if (showtimes.length > 0)
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
