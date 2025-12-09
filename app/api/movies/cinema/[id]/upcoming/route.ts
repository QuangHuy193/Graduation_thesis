import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/function";

export async function GET(
  req: Request,
  { params }: { params: { id: number } }
) {
  try {
    const { id } = await params;

    if (!id) {
      return errorResponse("Thiếu cinema_id", 400);
    }

    // Lấy lịch chiếu trong 2 ngày: hôm nay + ngày mai
    const [rows] = await db.query(
      `
      SELECT 
        m.movie_id,
        m.name,
        m.duration,
        m.age_require,
        MAX(img.url) AS image,
        c1.name AS country,
        c2.language AS subtitle,
        GROUP_CONCAT(DISTINCT g.name) AS genre,
        s.showtime_id,
        s.date,                 
        mc.start_time,
        mc.movie_screen_id
      FROM showtime s
      JOIN movies m ON m.movie_id = s.movie_id
      JOIN images img ON img.movie_id = m.movie_id
      JOIN movie_screenings mc ON mc.movie_screen_id = s.movie_screen_id
      JOIN rooms r ON r.room_id = s.room_id
      JOIN cinemas c ON c.cinema_id = r.cinema_id
      JOIN movie_genre mg ON mg.movie_id = m.movie_id
      JOIN genres g ON g.genre_id = mg.genre_id
      JOIN country c1 ON m.country_id = c1.country_id
      JOIN country c2 ON m.subtitle_id = c2.country_id
      WHERE 
        c.cinema_id = ? 
        AND m.status = 0 
        AND s.status = 0
        AND s.date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 1 DAY)
      GROUP BY 
        m.movie_id, 
        s.showtime_id, 
        s.date
      `,
      [id]
    );

    // group dữ liệu
    const movies: any = {};

    // lấy thời gian hiện tại
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    // YYYY-MM-DD hôm nay
    const today = now.toISOString().split("T")[0];

    for (const r of rows as any[]) {
      // group theo movie
      if (!movies[r.movie_id]) {
        movies[r.movie_id] = {
          movie_id: r.movie_id,
          name: r.name,
          image: r.image,
          age_require: r.age_require,
          country: r.country,
          subtitle: r.subtitle,
          duration: r.duration,
          genres: r.genre
            ? r.genre.split(",").map((g: string) => g.trim())
            : [],
          dates: {},
        };
      }

      // group theo date
      if (!movies[r.movie_id].dates[r.date]) {
        movies[r.movie_id].dates[r.date] = [];
      }

      // 🔥 lọc giờ lớn hơn hiện tại nếu là hôm nay
      let canPush = true;

      if (r.date === today) {
        const [hh, mm] = r.start_time.split(":").map(Number);
        const timeInMinutes = hh * 60 + mm;

        if (timeInMinutes <= currentMinutes) {
          canPush = false; // bỏ giờ đã qua
        }
      }

      if (canPush) {
        movies[r.movie_id].dates[r.date].push({
          movie_screen_id: r.movie_screen_id,
          showtime_id: r.showtime_id,
          start_time: r.start_time,
        });
      }
    }

    // convert object → array
    const result = Object.values(movies).map((m: any) => ({
      ...m,
      dates: Object.entries(m.dates).map(([date, showtimes]) => ({
        date,
        showtimes,
      })),
    }));

    return successResponse(result, "success", 200);
  } catch (error) {
    console.error(error);
    return errorResponse("Lấy danh sách thất bại", 500);
  }
}
