import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/function";
import { MovieFullITF } from "@/lib/interface/movieInterface";
import { RowDataPacket } from "mysql2";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const keyword = searchParams.get("keyword") || "";

    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT 
      m.movie_id, m.name, m.description, m.duration, m.age_require, m.trailer_url,
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
      WHERE vn_normalize(m.name) COLLATE utf8mb4_unicode_ci 
      LIKE CONCAT('%', vn_normalize(?) COLLATE utf8mb4_unicode_ci, '%')
      GROUP BY m.movie_id`,
      [keyword]
    );

    // đảm bảo rows là mảng
    const rawRows = Array.isArray(rows) ? rows : [];

    const movies: MovieFullITF[] = rawRows.map((row: any) => ({
      ...row,
      // Nếu genres/actors có thể null, xử lý về mảng rỗng
      genres: row.genres ? String(row.genres).split(",") : [],
      actors: row.actors ? String(row.actors).split(",") : [],
      image: row.image ?? null,
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
