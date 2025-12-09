import { LIMITDAY } from "@/lib/constant";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/function";

// Lấy danh phim bao gồm rạp + suất chiếu
export async function GET() {
  try {
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

        c.cinema_id, 
        c.name AS cinema_name, 
        c.specific_address, 
        c.ward, 
        c.province,

        s.showtime_id, 
        s.date,                -- dùng trường date mới
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
        s.date BETWEEN CURDATE() 
        AND DATE_ADD(CURDATE(), INTERVAL ${LIMITDAY - 1} DAY)
        AND m.status = 1
        AND s.status = 1

      GROUP BY 
        m.movie_id, 
        c.cinema_id, 
        s.showtime_id, 
        s.date
      `
    );

    // GROUP theo movie
    const movies: any = {};

    // lấy thời gian hiện tại
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const today = now.toISOString().split("T")[0];

    for (const r of rows as any[]) {
      // movie
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

      // date
      if (!movies[r.movie_id].dates[r.date]) {
        movies[r.movie_id].dates[r.date] = {};
      }

      // cinema
      if (!movies[r.movie_id].dates[r.date][r.cinema_id]) {
        movies[r.movie_id].dates[r.date][r.cinema_id] = {
          cinema_id: r.cinema_id,
          name: r.cinema_name,
          address: `${r.specific_address}, ${r.ward}, ${r.province}`,
          showtimes: [],
        };
      }

      // 🔥 lọc giờ (nếu là hôm nay)
      let canPush = true;

      if (r.date === today) {
        const [hh, mm] = r.start_time.split(":").map(Number);
        const timeMinutes = hh * 60 + mm;

        if (timeMinutes <= currentMinutes) {
          canPush = false;
        }
      }

      if (canPush) {
        movies[r.movie_id].dates[r.date][r.cinema_id].showtimes.push({
          movie_screen_id: r.movie_screen_id,
          showtime_id: r.showtime_id,
          start_time: r.start_time,
        });
      }
    }

    // convert về đúng cấu trúc cũ
    const result = Object.values(movies).map((m: any) => ({
      ...m,
      dates: Object.entries(m.dates).map(([date, cinemas]) => ({
        date,
        cinemas: Object.values(cinemas),
      })),
    }));

    return successResponse(result, "success", 200);
  } catch (error) {
    console.error(error);
    return errorResponse("Lấy danh sách thất bại", 500);
  }
}
