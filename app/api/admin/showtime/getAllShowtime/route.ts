import { successResponse, errorResponse } from "@/lib/function";
import { db } from "@/lib/db";

export async function GET() {
    const conn = await db.getConnection();

    try {
        const sql = `
        SELECT
            s.showtime_id,
            s.start_date,
            s.end_date,
            s.status,
            s.movie_id,
            s.room_id,
			
            m.name AS movie_title,
            r.name AS room_name,
            
			ms.start_time,
			ms.end_time
		
        FROM showtime s
        LEFT JOIN movies m ON m.movie_id = s.movie_id
        LEFT JOIN rooms r ON r.room_id = s.room_id
        left join movie_screenings ms on ms.movie_screen_id=s.movie_screen_id
        `;

        const [rows] = await conn.query(sql);

        const data = (rows as any[]).map((r) => ({
            showtime_id: Number(r.showtime_id),
            start_date: r.start_date ? formatLocalDate(r.start_date) : null,
            end_date: r.end_date ? formatLocalDate(r.end_date) : null,
            status: r.status === null ? null : Number(r.status),
            movie_id: r.movie_id === null ? null : Number(r.movie_id),
            room_id: r.room_id === null ? null : Number(r.room_id),

            movie_title: r.movie_title || null,
            room_name: r.room_name || null,

            screening_start: r.start_time || null,
            screening_end: r.end_time || null,
        }));
        function formatLocalDate(date: any) {
            if (typeof date === "string") return date; // MySQL driver có thể trả string
            return (
                date.getFullYear() +
                "-" +
                String(date.getMonth() + 1).padStart(2, "0") +
                "-" +
                String(date.getDate()).padStart(2, "0") +
                " " +
                String(date.getHours()).padStart(2, "0") +
                ":" +
                String(date.getMinutes()).padStart(2, "0") +
                ":" +
                String(date.getSeconds()).padStart(2, "0")
            );
        }
        return successResponse({ data, total: data.length }, "success", 200);
    } catch (err) {
        console.error("GET /api/admin/showtimes error:", err);
        return errorResponse("Internal server error", 500);
    } finally {
        // 🔥 QUAN TRỌNG: Giải phóng connection!
        try {
            if (conn?.release) conn.release();
        } catch (e) {
            console.warn("release failed", e);
        }
    }
}
