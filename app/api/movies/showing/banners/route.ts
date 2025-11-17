import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/function";
import { MovieFullITF } from "@/lib/interface/movieInterface";
import { RowDataPacket } from "mysql2"; // nếu dùng mysql2

export async function GET() {
  try {
    const [rows] = await db.query<RowDataPacket[]>(
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

    // đảm bảo rows là mảng
    const rawRows = Array.isArray(rows) ? rows : [];

    const movies: MovieFullITF[] = rawRows.map((row: any) => ({
      ...row,
      // Nếu genres/actors có thể null, xử lý về mảng rỗng
      genres: row.genres ? String(row.genres).split(",") : [],
      actors: row.actors ? String(row.actors).split(",") : [],
      image: row.image ?? null,
      // chuyển đổi kiểu nếu cần, ví dụ duration number, release_date -> string/Date...
    }));

    return successResponse<MovieFullITF[]>(
      movies,
      "success",
      200 // GET trả 200
    );
  } catch (error) {
    console.error(error);
    return errorResponse("Lấy danh sách thất bại", 500);
  }
}
