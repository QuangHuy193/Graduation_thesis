import { LIMITDAY } from "@/lib/constant";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/function";

//Lấy danh phim bao gồm rạp, suất chiếu
export async function GET() {
  try {
    const [rows] = await db.query(
      `WITH RECURSIVE days AS (
      SELECT CURDATE() AS d
      UNION ALL
      SELECT DATE_ADD(d, INTERVAL 1 DAY)
      FROM days
      WHERE d < DATE_ADD(CURDATE(), INTERVAL ${LIMITDAY - 1} DAY))
      SELECT m.movie_id, m.name, m.duration, m.age_require, MAX(img.url) AS image,
      c1.name AS country, c2.language AS subtitle,
      GROUP_CONCAT(DISTINCT g.name) AS genre,
      c.cinema_id, c.name AS cinema_name, c.specific_address, c.ward, c.province,
      s.showtime_id, mc.start_time, mc.movie_screen_id,
      days.d AS date
      FROM days
      JOIN showtime s 
      ON days.d BETWEEN s.start_date AND s.end_date
      JOIN movies m ON m.movie_id = s.movie_id
      JOIN images img ON img.movie_id = m.movie_id
      JOIN movie_screenings mc ON mc.movie_screen_id = s.movie_screen_id
      JOIN rooms r ON r.room_id = s.room_id
      JOIN cinemas c ON c.cinema_id = r.cinema_id
      JOIN movie_genre mg ON mg.movie_id = m.movie_id
      JOIN genres g ON g.genre_id = mg.genre_id
      JOIN country c1 ON m.country_id = c1.country_id
      JOIN country c2 ON m.subtitle_id = c2.country_id 
      GROUP BY m.movie_id, c.cinema_id, s.showtime_id, days.d`
    );

    // group theo movie
    const movies = {};

    for (const r of rows) {
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

      // showtimes
      movies[r.movie_id].dates[r.date][r.cinema_id].showtimes.push({
        movie_screen_id: r.movie_screen_id,
        showtime_id: r.showtime_id,
        start_time: r.start_time,
      });
    }

    // convert object → array, date → cinema[]
    const result = Object.values(movies).map((m) => ({
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
