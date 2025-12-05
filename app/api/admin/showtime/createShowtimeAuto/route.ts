// app/api/showtimes/create-with-day/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: Request) {
    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ ok: false, message: "Empty body" }, { status: 400 });

    const {
        movie_id,
        room_id,
        movie_screen_id,
        show_date, // YYYY-MM-DD
        start_date, // optional datetime
        end_date,   // optional datetime
        reuse_showtime = true, // if true try to reuse an existing showtime
        _temp_client_id = null // optional echo back
    } = body;

    if (!movie_id || !show_date) {
        return NextResponse.json({ ok: false, message: "movie_id and show_date are required" }, { status: 400 });
    }

    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        // Optional: try to find an existing showtime to reuse (same movie_id + room + movie_screen)
        let showtimeId: number | null = null;
        if (reuse_showtime) {
            const [found] = await conn.query(
                `SELECT showtime_id FROM showtime 
         WHERE movie_id = ? AND room_id = ? AND movie_screen_id = ? LIMIT 1 FOR UPDATE`,
                [movie_id, room_id, movie_screen_id]
            );
            const row = (found as any[])[0];
            if (row) showtimeId = Number(row.showtime_id);
        }

        // If no existing, create a new showtime (set start/end using show_date if not provided)
        if (!showtimeId) {
            const sdate = start_date ?? `${show_date} 00:00:00`;
            const edate = end_date ?? `${show_date} 23:59:59`;
            const [ins] = await conn.query(
                `INSERT INTO showtime (start_date, end_date, status, movie_id, room_id, movie_screen_id)
         VALUES (?, ?, 1, ?, ?, ?)`,
                [sdate, edate, movie_id, room_id, movie_screen_id]
            );
            showtimeId = (ins as any).insertId;
        }

        // Conflict check: ensure no other showtime_days in same room/date/slot
        if (room_id != null && movie_screen_id != null) {
            const [conf] = await conn.query(
                `SELECT id, showtime_id FROM showtime_days
         WHERE room_id = ? AND show_date = ? AND movie_screen_id = ? LIMIT 1 FOR UPDATE`,
                [room_id, show_date, movie_screen_id]
            );
            if ((conf as any[]).length) {
                // conflict -> rollback + return 409 with conflict info
                await conn.rollback();
                return NextResponse.json({
                    ok: false,
                    code: "conflict",
                    message: "Slot conflict",
                    conflict: { target_room: room_id, show_date, movie_screen_id, conflicting: (conf as any[])[0] }
                }, { status: 409 });
            }
        }

        // Insert or upsert showtime_days for (showtime_id, show_date)
        // Use ON DUPLICATE KEY UPDATE to be idempotent if (showtime_id, show_date) exists
        await conn.query(
            `INSERT INTO showtime_days (showtime_id, movie_id, room_id, show_date, movie_screen_id, status)
       VALUES (?, ?, ?, ?, ?, 'active')
       ON DUPLICATE KEY UPDATE room_id = VALUES(room_id), movie_screen_id = VALUES(movie_screen_id),
         movie_id = VALUES(movie_id), updated_at = NOW()`,
            [showtimeId, movie_id, room_id, show_date, movie_screen_id]
        );

        // Select the inserted/updated row
        const [rows] = await conn.query(
            `SELECT sd.* FROM showtime_days sd WHERE sd.showtime_id = ? AND sd.show_date = ? LIMIT 1`,
            [showtimeId, show_date]
        );
        const row = (rows as any[])[0] ?? null;

        await conn.commit();

        // return server row and echo temp id so client can map
        return NextResponse.json({ ok: true, row: { ...row, _temp_client_id } }, { status: 200 });
    } catch (err) {
        try { await conn.rollback(); } catch { }
        console.error("create-with-day error:", err);
        return NextResponse.json({ ok: false, message: String(err) }, { status: 500 });
    } finally {
        try { conn.release(); } catch { }
    }
}
