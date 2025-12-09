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
    const { total_price, showtime_id } = body;

    if (!total_price) {
      return errorResponse("Thiếu total_price đầu vào", 400);
    } else if (!showtime_id) {
      return errorResponse("Thiếu showtime đầu vào", 400);
    }

    const booking_time = getCurrentDateTime();

    const [data] = await db.query(
      `INSERT INTO booking 
      (total_price, booking_time, status, showtime_id, user_id)
       values (?,?,?,?,?)`,
      [total_price, booking_time, 0, showtime_id, id]
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
