import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/function";

//Lấy danh sách rạp, suất chiếu theo ngày
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const day = searchParams.get("day");

  if (!day) {
    return errorResponse("Thiếu ngày (day)", 400);
  }

  const dayNum = Number(day);
  if (isNaN(dayNum)) {
    return errorResponse("day phải là số", 400);
  }

  // Tính ngày đích
  const target = new Date();
  target.setDate(target.getDate() + dayNum);

  // Format YYYY-MM-DD
  const date = target.toISOString().split("T")[0];

  try {
    const [rows] = await db.query(
      `SELECT s.showtime_id, s.start_date, JSON_ARRAYAGG(ms.start_time) as start_time,
      c.cinema_id, c.name as cinema_name, c.specific_address, c.ward, c.province,
      r.room_id, r.name as room_name
      FROM showtime s 
      JOIN movie_screenings ms ON s.movie_screen_id = ms.movie_screen_id
      JOIN rooms r ON s.room_id = r.room_id
      JOIN cinemas c on c.cinema_id = r.cinema_id
      WHERE status = 1 AND DATE(s.start_date) = ?
      GROUP BY s.showtime_id`,
      [date]
    );

    const data = rows.map((item: any) => ({
      showtime_id: item.showtime_id,
      start_date: item.start_date,
      start_time: item.start_time,
      room: {
        room_id: item.room_id,
        room_name: item.room_name,
      },
      cinema: {
        cinema_id: item.cinema_id,
        name: item.cinema_name,
        specific_address: item.specific_address,
        ward: item.ward,
        province: item.province,
      },
    }));

    return successResponse(data, "success", 201);
  } catch (error) {
    console.error(error);
    return errorResponse("Lấy danh sách thất bại", 500);
  }
}
