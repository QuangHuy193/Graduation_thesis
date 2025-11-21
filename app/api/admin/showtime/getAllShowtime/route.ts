import { NextResponse } from "next/server";
import { successResponse, errorResponse } from "@/lib/function";
import { db } from "@/lib/db";

export async function GET() {
    const pool = await db.getConnection();

    try {
        const sql = `
      SELECT
        showtime_id,
        start_date,
        end_date,
        status,
        movie_id,
        room_id,
        movie_screen_id
      FROM showtime
    `;

        const [rows] = await pool.query(sql);

        const data = (rows as any[]).map((r) => ({
            showtime_id: Number(r.showtime_id),
            start_date: r.start_date ? new Date(r.start_date).toISOString() : null,
            end_date: r.end_date ? new Date(r.end_date).toISOString() : null,
            status: r.status === null ? null : Number(r.status),
            movie_id: r.movie_id === null ? null : Number(r.movie_id),
            room_id: r.room_id === null ? null : Number(r.room_id),
            movie_screen_id: r.movie_screen_id === null ? null : Number(r.movie_screen_id),
        }));

        // đường dẫn file bạn đã upload (local path)
        const diagram_url = "/mnt/data/137e286f-c411-4ca4-be33-7dbd7a359309.png";

        return successResponse({ data, total: data.length, diagram_url }, "success", 200);
    } catch (err) {
        console.error("GET /api/admin/showtimes error:", err);
        return errorResponse("Internal server error", 500);
    }
}
