// app/api/showtimes/move-batch/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

type MoveItemInput = {
    showtime_id: number;
    date?: string | null; // allow null to indicate deletion
    to_room?: number | null;
    to_movie_screen_id?: number | null;
    movie_id?: number | null;
    status?: 0 | 1 | null;
};

export async function POST(request: Request) {
    try {
        const body = await request.json().catch(() => null);
        if (!body || !Array.isArray(body.moves)) {
            return NextResponse.json(
                { ok: false, message: "Invalid payload; expected { moves: [...] }" },
                { status: 400 }
            );
        }

        const moves: MoveItemInput[] = body.moves;

        if (moves.length === 0) {
            return NextResponse.json({ ok: false, message: "No moves provided" }, { status: 400 });
        }

        // Pre-validation
        const validationErrors: any[] = [];
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

        for (let i = 0; i < moves.length; i++) {
            const raw = moves[i] as any;
            if (!("showtime_id" in raw) || typeof raw.showtime_id !== "number" || !Number.isFinite(raw.showtime_id)) {
                validationErrors.push({ index: i, reason: "showtime_id is required and must be a number", input: raw });
                continue;
            }
            if ("date" in raw && raw.date != null && typeof raw.date !== "string") {
                validationErrors.push({ index: i, reason: "date must be a string YYYY-MM-DD if provided", input: raw });
            } else if ("date" in raw && raw.date != null && !dateRegex.test(raw.date)) {
                validationErrors.push({ index: i, reason: "date must be YYYY-MM-DD", input: raw });
            }
            // other fields are optional; no extra validation here
        }

        if (validationErrors.length) {
            return NextResponse.json({ ok: false, message: "Validation failed", errors: validationErrors }, { status: 400 });
        }

        console.log("move-batch payload validated, count:", moves.length);

        const conn = await db.getConnection();
        try {
            await conn.beginTransaction();

            const results: any[] = [];

            for (const raw of moves) {
                const m = raw as MoveItemInput;

                // Lock the target showtime row
                const [selRows] = await conn.query(`SELECT * FROM showtime WHERE showtime_id = ? FOR UPDATE`, [m.showtime_id]);
                const existing = (selRows as any[])[0] ?? null;

                if (!existing) {
                    results.push({ ok: false, reason: "not_found", input: m });
                    continue;
                }

                // If payload includes key "date" and it's explicitly null -> DELETE the showtime
                if (Object.prototype.hasOwnProperty.call(m, "date") && m.date === null) {
                    await conn.query(`DELETE FROM showtime WHERE showtime_id = ?`, [m.showtime_id]);
                    results.push({ ok: true, action: "deleted", input: m });
                    continue;
                }

                // Build updates dynamically. Use 'in' checks to allow explicit nulls.
                const updates: string[] = [];
                const params: any[] = [];

                if (Object.prototype.hasOwnProperty.call(m, "to_room")) {
                    updates.push("room_id = ?");
                    params.push(m.to_room);
                }
                if (Object.prototype.hasOwnProperty.call(m, "to_movie_screen_id")) {
                    updates.push("movie_screen_id = ?");
                    params.push(m.to_movie_screen_id);
                }
                if (Object.prototype.hasOwnProperty.call(m, "movie_id")) {
                    updates.push("movie_id = ?");
                    params.push(m.movie_id);
                }
                if (Object.prototype.hasOwnProperty.call(m, "status")) {
                    updates.push("status = ?");
                    params.push(m.status);
                }
                if (Object.prototype.hasOwnProperty.call(m, "date")) {
                    updates.push("date = ?");
                    params.push(m.date);
                }

                if (updates.length) {
                    // push where param
                    params.push(m.showtime_id);
                    const sql = `UPDATE showtime SET ${updates.join(", ")} WHERE showtime_id = ?`;
                    await conn.query(sql, params);
                    // fetch fresh row
                    const [fresh] = await conn.query(`SELECT * FROM showtime WHERE showtime_id = ?`, [m.showtime_id]);
                    results.push({ ok: true, action: "updated", row: (fresh as any[])[0] });
                } else {
                    // nothing to update
                    results.push({ ok: true, action: "noop", row: existing });
                }
            } // end for

            await conn.commit();
            return NextResponse.json({ ok: true, results }, { status: 200 });
        } catch (err) {
            try {
                await conn.rollback();
            } catch (rbErr) {
                console.error("rollback failed:", rbErr);
            }
            console.error("move-batch error (during transaction):", err);
            return NextResponse.json({ ok: false, message: "Internal server error", error: `${err}` }, { status: 500 });
        } finally {
            try {
                conn.release();
            } catch (relErr) {
                console.error("connection release error:", relErr);
            }
        }
    } catch (err) {
        console.error("move-batch outer error:", err);
        return NextResponse.json({ ok: false, message: "Bad request or server error" }, { status: 400 });
    }
}
