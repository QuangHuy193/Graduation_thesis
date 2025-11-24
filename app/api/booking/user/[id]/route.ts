import { db } from "@/lib/db";
import {
  errorResponse,
  getCurrentDateTime,
  successResponse,
} from "@/lib/function";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { id } = await params;
    const { total_price, showtime_id, showtime_date } = body;

    if (!total_price || !showtime_id || !showtime_date) {
      return errorResponse("Thiếu dữ liệu đầu vào", 400);
    }

    const booking_time = getCurrentDateTime();

    const [data] = await db.query(
      `INSERT INTO booking 
      (total_price, booking_time, status, showtime_id, showtime_date, user_id)
       values (?,?,?,?,?,?)`,
      [total_price, booking_time, 0, showtime_id, showtime_date, id]
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
