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
            r.name AS room_name

        FROM showtime s
        LEFT JOIN movies m ON m.movie_id = s.movie_id
        LEFT JOIN rooms r ON r.room_id = s.room_id
        `;

        const [rows] = await conn.query(sql);

        const data = (rows as any[]).map((r) => ({
            showtime_id: Number(r.showtime_id),
            start_date: r.start_date ? new Date(r.start_date).toISOString() : null,
            end_date: r.end_date ? new Date(r.end_date).toISOString() : null,
            status: r.status === null ? null : Number(r.status),
            movie_id: r.movie_id === null ? null : Number(r.movie_id),
            room_id: r.room_id === null ? null : Number(r.room_id),

            movie_title: r.movie_title || null,
            room_name: r.room_name || null,
        }));

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
