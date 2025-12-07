import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/function";

//lấy danh sách ngày chiếu theo phim (id) và rạp, ngày
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const movie_id = searchParams.get("movie_id");
  const cinema_id = searchParams.get("cinema_id");
  const date = searchParams.get("date");
  try {
    const [rows] = await db.query(
      `SELECT ms.movie_screen_id, ms.start_time
      FROM movie_screenings ms
      JOIN showtime st ON st.movie_screen_id = ms.movie_screen_id
      JOIN movies m ON st.movie_id = m.movie_id
      JOIN rooms r ON r.room_id = st.room_id
      WHERE m.movie_id = ? AND r.cinema_id = ? AND st.date = ?`,
      [movie_id, cinema_id, date]
    );

    return successResponse(rows, "success", 201);
  } catch (error) {
    console.error(error);
    return errorResponse("Lấy danh sách giờ chiếu thất bại", 500);
  }
}
