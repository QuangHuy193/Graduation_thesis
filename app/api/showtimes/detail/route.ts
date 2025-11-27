import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/function";

//showtime theo rạp, phim, suất
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const movie_id = searchParams.get("movie_id");
  const date = searchParams.get("date");
  const time = searchParams.get("time");
  try {
    const [rows] = await db.query(
      `SELECT st.showtime_id, st.room_id, r.name as room_name, c.name as cinema_name, 
      ms.start_time as time, c.specific_address, c.ward, c.province
      FROM showtime st
      JOIN movie_screenings ms ON st.movie_screen_id = ms.movie_screen_id
      JOIN movies m ON st.movie_id = m.movie_id
      JOIN rooms r ON r.room_id = st.room_id
      JOIN cinemas c ON c.cinema_id = r.cinema_id
      WHERE st.movie_id = ? AND ? >= st.start_date AND ? <= st.end_date AND ms.movie_screen_id = ?`,
      [movie_id, date, date, time]
    );

    const data = rows?.map((d) => {
      return {
        showtime_id: d.showtime_id,
        room_id: d.room_id,
        room_name: d.room_name,
        cinema_name: d.cinema_name,
        time: d.time,
        cinema_address: `${d.specific_address}, ${d.ward}, ${d.province}`,
      };
    });

    return successResponse(data, "success", 201);
  } catch (error) {
    console.error(error);
    return errorResponse("Lấy showtime chiếu thất bại", 500);
  }
}
