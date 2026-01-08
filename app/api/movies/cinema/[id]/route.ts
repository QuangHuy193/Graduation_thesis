import { LIMITDAY } from "@/lib/constant";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/function";

export async function GET(
  req: Request,
  { params }: { params: { id: number } }
) {
  const { id } = await params; // cinema_id

  try {
    const [rows] = await db.query(
      `
      SELECT DISTINCT
        m.movie_id,
        m.name
      FROM movies m
      JOIN showtime st ON st.movie_id = m.movie_id
      JOIN movie_screenings ms ON ms.movie_screen_id = st.movie_screen_id
      JOIN rooms r ON r.room_id = st.room_id
      WHERE r.cinema_id = ?
        AND st.status = 1
        AND DATE(st.date) BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL ${
          LIMITDAY - 1
        } DAY)
        AND (
          -- ngày tương lai
          DATE(st.date) > CURDATE()
          -- hôm nay thì lọc giờ
          OR (
            DATE(st.date) = CURDATE()
            AND ms.start_time > DATE_FORMAT(CURTIME(), '%H:%i')
          )
        )
      ORDER BY m.name
      `,
      [id]
    );

    return successResponse(rows, "success", 200);
  } catch (error) {
    console.error(error);
    return errorResponse("Lấy danh sách phim thất bại", 500);
  }
}
