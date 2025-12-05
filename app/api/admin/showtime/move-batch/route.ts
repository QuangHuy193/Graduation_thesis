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
            return NextResponse.json({ ok: false, message: "Invalid payload; expected { moves: [...] }" }, { status: 400 });
        }

        const moves: MoveItemInput[] = body.moves;

        if (moves.length === 0) {
            return NextResponse.json({ ok: false, message: "No moves provided" }, { status: 400 });
        }

        // ===== Pre-validation: ensure required fields exist BEFORE touching DB =====
        const validationErrors: any[] = [];
        for (let i = 0; i < moves.length; i++) {
            const raw = moves[i] as any;
            if ("showtime_day_id" in raw) {
                if (typeof raw.showtime_day_id !== "number") {
                    validationErrors.push({ index: i, reason: "showtime_day_id must be a number", input: raw });
                }
            } else if ("showtime_id" in raw) {
                if (typeof raw.showtime_id !== "number" || typeof raw.show_date !== "string") {
                    validationErrors.push({ index: i, reason: "showtime_id (number) and show_date (string) are required", input: raw });
                } else if (!/^\d{4}-\d{2}-\d{2}$/.test(raw.show_date)) {
                    validationErrors.push({ index: i, reason: "show_date must be YYYY-MM-DD", input: raw });
                }
            } else {
                validationErrors.push({ index: i, reason: "invalid_move_shape", input: raw });
            }
        }

        if (validationErrors.length) {
            // don't touch DB at all
            return NextResponse.json({ ok: false, message: "Validation failed", errors: validationErrors }, { status: 400 });
        }

        // Log incoming moves for debugging
        console.log("move-batch payload validated, count:", moves.length);

        const conn = await db.getConnection();
        try {
            await conn.beginTransaction();

            const results: any[] = [];

            for (const raw of moves) {
                if ("showtime_day_id" in raw) {
                    const m = raw as Extract<MoveItemInput, { showtime_day_id: number }>;

                    // Lock and update
                    const [rows] = await conn.query(`SELECT * FROM showtime_days WHERE id = ? FOR UPDATE`, [m.showtime_day_id]);
                    const existing = (rows as any[])[0] ?? null;

                    if (!existing) {
                        results.push({ ok: false, reason: "not_found", input: m });
                        continue;
                    }

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
                        await conn.query(`UPDATE showtime_days SET ${updates.join(", ")}, updated_at = NOW() WHERE id = ?`, params);
                    }

                    const [freshRows] = await conn.query(`SELECT * FROM showtime_days WHERE id = ?`, [m.showtime_day_id]);
                    results.push({ ok: true, action: "updated", row: (freshRows as any[])[0] });
                } else {
                    // showtime_id branch (validated already)
                    const m = raw as Extract<MoveItemInput, { showtime_id: number }>;

                    // attempt to infer movie_id if not provided
                    let movieId = typeof m.movie_id !== "undefined" ? m.movie_id : null;
                    if (movieId === null) {
                        const [srows] = await conn.query(`SELECT movie_id FROM showtime WHERE id = ? LIMIT 1`, [m.showtime_id]);
                        const s = (srows as any[])[0];
                        if (s) movieId = s.movie_id ?? null;
                    }

                    const insertCols = ["showtime_id", "show_date", "room_id", "movie_screen_id", "movie_id", "status", "created_at", "updated_at"];
                    const insertPlaceholders = insertCols.map(() => "?").join(", ");
                    const insertValues = [
                        m.showtime_id,
                        m.show_date,
                        m.to_room,
                        typeof m.to_movie_screen_id !== "undefined" ? m.to_movie_screen_id : null,
                        movieId,
                        typeof m.status !== "undefined" ? m.status : "active",
                        new Date(),
                        new Date(),
                    ];

                    const dupUpdates = [
                        "room_id = VALUES(room_id)",
                        "movie_screen_id = VALUES(movie_screen_id)",
                        "movie_id = VALUES(movie_id)",
                        "status = VALUES(status)",
                        "updated_at = NOW()",
                    ].join(", ");

                    await conn.query(
                        `INSERT INTO showtime_days (${insertCols.join(", ")}) VALUES (${insertPlaceholders}) ON DUPLICATE KEY UPDATE ${dupUpdates}`,
                        insertValues
                    );

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
                }
            } // end for

            await conn.commit();
            return NextResponse.json({ ok: true, results }, { status: 200 });
        } catch (err) {
            // try rollback and log rollback errors
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
