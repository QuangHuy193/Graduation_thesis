import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/function";
import { MovieFullITF } from "@/lib/interface/movieInterface";

export async function GET(
    req: Request,
    { params }: { params: { id: number } }
) {
    const { id } = await params;
    try {
        // db.query thường trả về [rows, fields]
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
      LEFT JOIN images i ON m.movie_id = i.movie_id
      WHERE m.movie_id = ? 
      GROUP BY m.movie_id`,
            [id]
        );

        // rows có thể là RowDataPacket[] hoặc OkPacket; kiểm tra trước khi map
        if (!Array.isArray(rows) || rows.length === 0) {
            // không tìm thấy movie
            return errorResponse("Không tìm thấy movie", 404);
        }

        // Lấy record đầu tiên (vì truy vấn theo id trả 1 hàng)
        const raw = rows[0] as any;

        const movie: MovieFullITF = {
            movie_id: Number(raw.movie_id ?? 0),
            name: raw.name ?? "",
            description: raw.description ?? "",
            duration: raw.duration != null ? Number(raw.duration) : 0,
            trailer_url: raw.trailer_url ?? "",
            release_date: raw.release_date ?? "",
            status: raw.status != null ? Number(raw.status) : 0,
            age_require: raw.age_require != null ? Number(raw.age_require) : 0,
            country: raw.country ?? "",
            subtitle: raw.subtitle ?? "",
            image: raw.image ?? "",
            // convert CSV -> array (defensive)
            genres: raw.genres ? String(raw.genres).split(",").map((s: string) => s.trim()).filter(Boolean) : [],
            actors: raw.actors ? String(raw.actors).split(",").map((s: string) => s.trim()).filter(Boolean) : [],
        } as MovieFullITF;

        return successResponse<MovieFullITF>(movie, "success", 200);
    } catch (error) {
        console.error(error);
        return errorResponse("Lấy thông tin phim thất bại", 500);
    }
}
