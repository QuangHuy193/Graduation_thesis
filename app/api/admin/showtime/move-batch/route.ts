// app/api/showtimes/move-batch/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

type MoveItem = { showtime_id: number; to_room: number | null };

export async function POST(request: Request) {
    try {
        const body = await request.json().catch(() => null);
        if (!body || !Array.isArray(body.moves)) {
            return NextResponse.json(
                { ok: false, message: "Invalid payload; expected { moves: [...] }" },
                { status: 400 }
            );
        }

        // Basic sanitization
        const moves: MoveItem[] = [];
        for (const m of body.moves) {
            if (!m || typeof m.showtime_id !== "number") {
                return NextResponse.json(
                    { ok: false, message: "Each move must include numeric showtime_id" },
                    { status: 400 }
                );
            }
            const to_room =
                m.to_room === null
                    ? null
                    : typeof m.to_room === "number"
                        ? m.to_room
                        : null;

            moves.push({ showtime_id: m.showtime_id, to_room });
        }

        if (moves.length === 0) {
            return NextResponse.json(
                { ok: false, message: "No moves provided" },
                { status: 400 }
            );
        }

        const conn = await db.getConnection();
        try {
            await conn.beginTransaction();

            const ids = moves.map((m) => m.showtime_id);
            const placeholders = ids.map(() => "?").join(",");

            // 1) Fetch affected showtimes (authoritative info)
            const [rows] = await conn.query(
                `SELECT showtime_id 
                 FROM showtime 
                 WHERE showtime_id IN (${placeholders})
                 FOR UPDATE`,
                ids
            );

            const foundIds = new Set((rows as any[]).map((r) => r.showtime_id));
            const missing = ids.filter((i) => !foundIds.has(i));

            if (missing.length) {
                await conn.rollback();
                return NextResponse.json(
                    { ok: false, message: "Some showtimes not found", missing },
                    { status: 404 }
                );
            }

            // 2) No conflict checks — directly update
            for (const mv of moves) {
                await conn.query(
                    `UPDATE showtime SET room_id = ? WHERE showtime_id = ?`,
                    [mv.to_room, mv.showtime_id]
                );
            }

            // 3) Return updated rows
            const [updatedRows] = await conn.query(
                `SELECT 
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
                 WHERE s.showtime_id IN (${placeholders})`,
                ids
            );

            await conn.commit();
            return NextResponse.json({ ok: true, updated: updatedRows }, { status: 200 });
        } catch (err) {
            try {
                await conn.rollback();
            } catch { }
            console.error("move-batch error:", err);
            return NextResponse.json(
                { ok: false, message: "Internal server error", error: `${err}` },
                { status: 500 }
            );
        } finally {
            try {
                conn.release();
            } catch { }
        }
    } catch (err) {
        console.error("move-batch outer error:", err);
        return NextResponse.json(
            { ok: false, message: "Bad request or server error" },
            { status: 400 }
        );
    }
}
