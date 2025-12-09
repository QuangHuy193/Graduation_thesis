import { db } from "@/lib/db";
import {
  errorResponse,
  getCurrentDateTime,
  successResponse,
} from "@/lib/function";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { total_price, showtime_id, name, phone, email } = body;

    if (!total_price || !showtime_id || !name || !phone || !email) {
      return errorResponse("Thiếu dữ liệu đầu vào", 400);
    }

    const booking_time = getCurrentDateTime();

    const [data] = await db.query(
      `INSERT INTO booking 
      (total_price, booking_time, status, showtime_id, name, phone, email)
       values (?,?,?,?,?,?,?)`,
      [total_price, booking_time, 0, showtime_id, name, phone, email]
    );

    return successResponse(
      {
        booking_id: data.insertId,
      },
      "Tạo booking thành công",
      201
    );
  } catch (error) {
    console.error(error);
    return errorResponse("Tạo booking thất bại", 500, error.message);
  }
}
