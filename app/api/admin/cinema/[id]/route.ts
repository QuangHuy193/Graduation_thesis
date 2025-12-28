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
      [name, specific_address, ward, province, price_base, 1]
    );

    // TODO cập nhật price_fixed

    return successResponse({}, "Cập nhật rạp thành công", 200);
  } catch (error) {
    console.error(error);
    return errorResponse("Cập nhật rạp thất bại", 500, error.message);
  }
}
