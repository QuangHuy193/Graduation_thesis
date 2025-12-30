import { db } from "@/lib/db";
import { errorResponse, successResponse } from "@/lib/function";

// thêm rạp
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, specific_address, ward, province, price_base, time } = body;

    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT cinema_id FROM cinemas WHERE name = ? AND status = 1 LIMIT 1`,
      [name]
    );

    if (rows.length > 0) {
      return errorResponse("Tên rạp đã tồn tại", 409);
    }

    const [insert] = await db.query(
      `INSERT INTO cinemas (name, specific_address, ward, province, price_base, status)
      VALUES (?,?,?,?,?,?)`,
      [name, specific_address, ward, province, price_base, 1]
    );

    const values = time.map((t) => [insert.insertId, t.movie_screen_id]);
    await db.query(
      `INSERT INTO movie_screening_cinema (cinema_id, movie_screen_id)
      VALUES (?)`,
      [values]
    );

    return successResponse(
      {
        cinema_id: insert.insertId,
      },
      "Tạo rạp thành công",
      201
    );
  } catch (error) {
    console.error(error);
    return errorResponse("Tạo rạp thất bại", 500, error.message);
  }
}
