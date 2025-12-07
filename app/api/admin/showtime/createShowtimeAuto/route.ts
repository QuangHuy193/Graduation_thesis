// app/api/showtimes/create-with-day/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: Request) {
    const body = await req.json().catch(() => null);
    if (!body) {
        return NextResponse.json({ ok: false, message: "Empty body" }, { status: 400 });
    }

    const {
        movie_id,
        room_id = null,
        movie_screen_id = null,
        date, // expected 'YYYY-MM-DD'
        reuse_showtime = true,
        _temp_client_id = null,
        status = 1, // default active
    } = body as {
        movie_id?: number;
        room_id?: number | null;
        movie_screen_id?: number | null;
        date?: string;
        reuse_showtime?: boolean;
        _temp_client_id?: number | null;
        status?: number | null;
    };

    // Basic validation
    if (typeof movie_id !== "number" || !Number.isFinite(movie_id)) {
        return NextResponse.json({ ok: false, message: "movie_id is required and must be a number" }, { status: 400 });
    }
    if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return NextResponse.json({ ok: false, message: "date is required and must be YYYY-MM-DD" }, { status: 400 });
    }

    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        let showtimeId: number | null = null;

        // Try to reuse an existing showtime matching movie + room + screen + date
        if (reuse_showtime) {
            const [found] = await conn.query(
                `SELECT showtime_id FROM showtime
         WHERE movie_id = ? AND room_id <=> ? AND movie_screen_id <=> ? AND date = ?
         LIMIT 1 FOR UPDATE`,
                [movie_id, room_id, movie_screen_id, date]
            );
            const row = (found as any[])[0];
            if (row && row.showtime_id) {
                showtimeId = Number(row.showtime_id);
            }
        }

        // If found -> update it (optional) else create new showtime row
        if (showtimeId) {
            // Update fields if needed
            await conn.query(
                `UPDATE showtime
         SET status = ?, movie_id = ?, room_id = ?, movie_screen_id = ?, date = ?
         WHERE showtime_id = ?`,
                [status, movie_id, room_id, movie_screen_id, date, showtimeId]
            );
        } else {
            const [ins] = await conn.query(
                `INSERT INTO showtime (date, status, movie_id, room_id, movie_screen_id)
         VALUES (?, ?, ?, ?, ?)`,
                [date, status, movie_id, room_id, movie_screen_id]
            );
            showtimeId = Number((ins as any).insertId);
        }

        // Conflict check: ensure no other showtime (different id) occupies same room + date + movie_screen_id
        // Only meaningful when room_id and movie_screen_id are provided (not null)
        if (room_id != null && movie_screen_id != null) {
            const [conf] = await conn.query(
                `SELECT showtime_id, date, room_id, movie_screen_id FROM showtime
         WHERE room_id = ? AND date = ? AND movie_screen_id = ? LIMIT 1 FOR UPDATE`,
                [room_id, date, movie_screen_id]
            );
            const confRow = (conf as any[])[0];
            if (confRow && Number(confRow.showtime_id) !== showtimeId) {
                await conn.rollback();
                return NextResponse.json(
                    {
                        ok: false,
                        code: "conflict",
                        message: "Slot conflict",
                        conflict: { target_room: room_id, show_date: date, movie_screen_id, conflicting: confRow },
                    },
                    { status: 409 }
                );
            }
        }

        // Select and return the canonical showtime row
        const [rows] = await conn.query(
            `SELECT s.* FROM showtime s WHERE s.showtime_id = ? LIMIT 1`,
            [showtimeId]
        );
        const outRow = (rows as any[])[0] ?? null;

        await conn.commit();

        return NextResponse.json({ ok: true, row: { ...outRow, _temp_client_id } }, { status: 200 });
    } catch (err) {
        try {
            await conn.rollback();
        } catch (e) {
            console.error("rollback error:", e);
        }
        console.error("create-with-day error:", err);
        return NextResponse.json({ ok: false, message: String(err) }, { status: 500 });
    } finally {
        try {
            conn.release();
        } catch (e) {
            console.error("connection release error:", e);
        }
    }
}
