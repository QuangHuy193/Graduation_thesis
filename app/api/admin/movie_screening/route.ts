import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/function";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { start_time, end_time } = body;
    await db.execute(
      `INSERT INTO movie_screenings (start_time, end_time) VALUES (?,?)`,
      [start_time, end_time]
    );
    return successResponse([], "Thêm khung giờ chiếu thành công", 201);
  } catch (error) {
    console.log(error);
    return errorResponse("Thêm khung giờ chiếu thất bại", 500);
  }
}
