// app/api/showtimes/move-batch/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * Expected payload:
 * {
 *   moves: [
 *     // update existing showtime_day by id
 *     {
 *       showtime_day_id: number,
 *       to_room: number | null,
 *       to_movie_screen_id?: number | null,
 *       movie_id?: number | null, // optional override
 *       status?: 'active' | 'inactive' // optional
 *     },
 *     // OR upsert by showtime_id + show_date (create if not exists)
 *     {
 *       showtime_id: number,
 *       show_date: "YYYY-MM-DD",
 *       movie_id?: number | null,
 *       to_room: number | null,
 *       to_movie_screen_id?: number | null,
 *       status?: 'active' | 'inactive'
 *     }
 *   ]
 * }
 */

type MoveItemInput =
    | {
        showtime_day_id: number;
        to_room: number | null;
        to_movie_screen_id?: number | null;
        movie_id?: number | null;
        status?: "active" | "inactive";
    }
    | {
        showtime_id: number;
        show_date: string;
        to_room: number | null;
        movie_id?: number | null;
        to_movie_screen_id?: number | null;
        status?: "active" | "inactive";
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

        const conn = await db.getConnection();
        try {
            await conn.beginTransaction();

            const results: any[] = [];

            for (const raw of moves) {
                // validate shape
                if ("showtime_day_id" in raw) {
                    const m = raw as Extract<MoveItemInput, { showtime_day_id: number }>;
                    if (typeof m.showtime_day_id !== "number") {
                        throw new Error("showtime_day_id must be a number");
                    }

                    // Lock the specific showtime_days row for update (if exists)
                    const [rows] = await conn.query(
                        `SELECT * FROM showtime_days WHERE id = ? FOR UPDATE`,
                        [m.showtime_day_id]
                    );
                    const existing = (rows as any[])[0] ?? null;

                    if (!existing) {
                        // Not found => respond with not found for this move (but continue others)
                        results.push({ ok: false, reason: "not_found", input: m });
                        continue;
                    }

                    // Build update fields
                    const updates: string[] = [];
                    const params: any[] = [];

                    if (typeof m.to_room !== "undefined") {
                        updates.push("room_id = ?");
                        params.push(m.to_room);
                    }
                    if (typeof m.to_movie_screen_id !== "undefined") {
                        updates.push("movie_screen_id = ?");
                        params.push(m.to_movie_screen_id);
                    }
                    if (typeof m.movie_id !== "undefined") {
                        updates.push("movie_id = ?");
                        params.push(m.movie_id);
                    }
                    if (typeof m.status !== "undefined") {
                        updates.push("status = ?");
                        params.push(m.status);
                    }

                    if (updates.length) {
                        params.push(m.showtime_day_id);
                        await conn.query(
                            `UPDATE showtime_days SET ${updates.join(", ")}, updated_at = NOW() WHERE id = ?`,
                            params
                        );
                    }

                    const [freshRows] = await conn.query(`SELECT * FROM showtime_days WHERE id = ?`, [
                        m.showtime_day_id,
                    ]);
                    results.push({ ok: true, action: "updated", row: (freshRows as any[])[0] });
                } else if ("showtime_id" in raw) {
                    const m = raw as Extract<MoveItemInput, { showtime_id: number }>;
                    if (typeof m.showtime_id !== "number" || typeof m.show_date !== "string") {
                        throw new Error("showtime_id (number) and show_date (string) are required for create/upsert moves");
                    }

                    // We will attempt to insert a new showtime_days, but uniqueness constraint (showtime_id, show_date)
                    // means we should either INSERT ... ON DUPLICATE KEY UPDATE (MySQL) or try to UPDATE if exists.

                    // Use movie_id from payload if provided, otherwise try to infer from `showtime` table:
                    let movieId = typeof m.movie_id !== "undefined" ? m.movie_id : null;
                    if (movieId === null) {
                        // attempt to read from `showtime` table if exists
                        const [srows] = await conn.query(`SELECT movie_id FROM showtime WHERE showtime_id = ? LIMIT 1`, [
                            m.showtime_id,
                        ]);
                        const s = (srows as any[])[0];
                        if (s) movieId = s.movie_id ?? null;
                    }

                    // Upsert using MySQL ON DUPLICATE KEY UPDATE: this relies on UNIQUE KEY (showtime_id, show_date)
                    // from your schema to decide duplicate.
                    // Compose insert columns and values
                    const insertCols: string[] = ["showtime_id", "show_date", "room_id", "movie_screen_id", "movie_id", "status", "created_at", "updated_at"];
                    const insertPlaceholders = insertCols.map(() => "?").join(", ");
                    // Provide values in same order: created_at/updated_at set to NOW() for convenience
                    const insertValues = [
                        m.showtime_id,
                        m.show_date,
                        m.to_room,
                        typeof m.to_movie_screen_id !== "undefined" ? m.to_movie_screen_id : null,
                        movieId,
                        typeof m.status !== "undefined" ? m.status : "active",
                        new Date(), // created_at
                        new Date(), // updated_at
                    ];

                    // Build duplicate update clause
                    const dupUpdates = [
                        "room_id = VALUES(room_id)",
                        "movie_screen_id = VALUES(movie_screen_id)",
                        "movie_id = VALUES(movie_id)",
                        "status = VALUES(status)",
                        "updated_at = NOW()",
                    ].join(", ");

                    // Run insert ... ON DUPLICATE KEY UPDATE
                    await conn.query(
                        `INSERT INTO showtime_days (${insertCols.join(", ")}) VALUES (${insertPlaceholders}) ON DUPLICATE KEY UPDATE ${dupUpdates}`,
                        insertValues
                    );

                    // Now retrieve the row (either existing or newly created)
                    const [foundRows] = await conn.query(
                        `SELECT sd.* FROM showtime_days sd WHERE sd.showtime_id = ? AND sd.show_date = ? LIMIT 1`,
                        [m.showtime_id, m.show_date]
                    );
                    const row = (foundRows as any[])[0] ?? null;
                    if (!row) {
                        results.push({ ok: false, reason: "not_found_after_upsert", input: m });
                    } else {
                        results.push({ ok: true, action: "upserted", row });
                    }
                } else {
                    // unknown shape
                    results.push({ ok: false, reason: "invalid_move_shape", input: raw });
                }
            } // end for moves

            await conn.commit();
            return NextResponse.json({ ok: true, results }, { status: 200 });
        } catch (err) {
            try {
                await conn.rollback();
            } catch { }
            console.error("move-batch error:", err);
            return NextResponse.json({ ok: false, message: "Internal server error", error: `${err}` }, { status: 500 });
        } finally {
            try {
                conn.release();
            } catch { }
        }
    } catch (err) {
        console.error("move-batch outer error:", err);
        return NextResponse.json({ ok: false, message: "Bad request or server error" }, { status: 400 });
    }
}
