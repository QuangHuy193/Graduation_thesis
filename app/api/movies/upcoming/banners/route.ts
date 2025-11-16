import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/function";
import { MovieFullITF } from "@/lib/interface/movieInterface";

//Lấy danh sách vài phim đang chiếu làm baner trượt
export async function GET() {
  try {
    const [rows] = await db.query(
      `SELECT 
      m.movie_id, m.name, m.description, m.duration, m.trailer_url, 
      m.release_date, m.status, m.age_require,
      c1.name AS country,
      c2.language AS subtitle,
      MAX(i.url) as image,
      GROUP_CONCAT(DISTINCT g.name) AS genres,
      GROUP_CONCAT(DISTINCT a.name) AS actors
      FROM movies m
      LEFT JOIN country c1 ON m.country_id = c1.country_id
      LEFT JOIN country c2 ON m.subtitle_id = c2.country_id
      LEFT JOIN movie_genre mg ON m.movie_id = mg.movie_id
      LEFT JOIN genres g ON mg.genre_id = g.genre_id
      LEFT JOIN movie_actor ma ON m.movie_id = ma.movie_id
      LEFT JOIN actors a ON ma.actor_id = a.actor_id
      JOIN images i ON m.movie_id = i.movie_id
      WHERE status = 1
      GROUP BY m.movie_id      
      ORDER BY m.release_date DESC
      LIMIT 12`
    );
    // Chuyển từ chuỗi thành mảng
    const movies = rows.map((row: any) => ({
      ...row,
      genres: row.genres ? row.genres.split(",") : [],
      actors: row.actors ? row.actors.split(",") : [],
    }));
    return successResponse<MovieFullITF[]>(movies, "success", 201);
  } catch (error) {
    console.error(error);
    return errorResponse("Lấy danh sách thất bại", 500);
  }
}
