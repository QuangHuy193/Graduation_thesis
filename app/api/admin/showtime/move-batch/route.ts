// app/api/showtimes/move-batch/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

type MoveItem = { showtime_id: number; to_room: number | null };

export async function POST(request: Request) {
    try {
        const body = await request.json().catch(() => null);
        if (!body || !Array.isArray(body.moves)) {
            return NextResponse.json({ ok: false, message: "Invalid payload; expected { moves: [...] }" }, { status: 400 });
        }

        // sanitize/validate moves
        const moves: MoveItem[] = [];
        for (const m of body.moves) {
            if (!m || typeof m.showtime_id !== "number") {
                return NextResponse.json({ ok: false, message: "Each move must include numeric showtime_id" }, { status: 400 });
            }
            const to_room = m.to_room === null ? null : (typeof m.to_room === "number" ? m.to_room : null);
            moves.push({ showtime_id: m.showtime_id, to_room });
        }

        if (moves.length === 0) {
            return NextResponse.json({ ok: false, message: "No moves provided" }, { status: 400 });
        }

        const conn = await db.getConnection();
        try {
            await conn.beginTransaction();

            // 1) Fetch affected showtimes from DB (authoritative info: dates, screening times, movie_screen_id, current room_id)
            const ids = moves.map((m) => m.showtime_id);
            const idPlaceholders = ids.map(() => "?").join(",");

            const [rows] = await conn.query(
                `SELECT s.showtime_id, s.start_date, s.end_date, s.room_id, s.movie_screen_id,
                mc.start_time as screening_start, mc.end_time as screening_end
         FROM showtime s
         LEFT JOIN movie_screenings mc on mc.movie_screen_id = s.movie_screen_id
         WHERE showtime_id IN (${idPlaceholders})
         FOR UPDATE`,
                ids
            );
            const fetched: any[] = Array.isArray(rows) ? (rows as any[]) : [];

            // ensure all requested showtime_ids exist
            const fetchedIds = new Set(fetched.map((f) => f.showtime_id));
            const missing = ids.filter((i) => !fetchedIds.has(i));
            if (missing.length) {
                await conn.rollback();
                return NextResponse.json({ ok: false, message: "Some showtimes not found", missing }, { status: 404 });
            }

            // helper: normalize time like "9:0" | "9:00" -> "09:00", return null if invalid
            const normalizeTime = (v?: string | null) => {
                if (v === null || v === undefined) return null;
                const s = String(v).trim();
                const m = s.match(/^(\d{1,2}):(\d{1,2})$/);
                if (!m) return null;
                const hh = parseInt(m[1], 10);
                const mm = parseInt(m[2], 10);
                if (Number.isNaN(hh) || Number.isNaN(mm) || hh < 0 || hh > 23 || mm < 0 || mm > 59) return null;
                const hhStr = hh < 10 ? `0${hh}` : `${hh}`;
                const mmStr = mm < 10 ? `0${mm}` : `${mm}`;
                return `${hhStr}:${mmStr}`;
            };

            // build map showtime_id -> { movie_screen_id, screeningStart, screeningEnd, startDate, endDate, room_id }
            type TimeWindow = {
                movie_screen_id?: number | null;
                screeningStart?: string | null;
                screeningEnd?: string | null;
                startDate?: string | null;
                endDate?: string | null;
                room_id?: number | null;
            };
            const timeById = new Map<number, TimeWindow>();
            for (const f of fetched) {
                timeById.set(f.showtime_id, {
                    movie_screen_id: f.movie_screen_id ?? null,
                    screeningStart: normalizeTime((f as any).screening_start ?? null),
                    screeningEnd: normalizeTime((f as any).screening_end ?? null),
                    startDate: f.start_date ?? null,
                    endDate: f.end_date ?? null,
                    room_id: f.room_id ?? null,
                });
            }

            // helper: convert "HH:MM" to minutes since midnight
            const toMinutes = (hhmm?: string | null) => {
                if (!hhmm) return null;
                const parts = hhmm.split(":");
                if (parts.length !== 2) return null;
                const hh = parseInt(parts[0], 10);
                const mm = parseInt(parts[1], 10);
                if (Number.isNaN(hh) || Number.isNaN(mm)) return null;
                return hh * 60 + mm;
            };

            // helper: exact-time equality (minutes) - returns true if start and end both equal
            const exactTimeEqual = (aStartMin: number | null, aEndMin: number | null, bStartMin: number | null, bEndMin: number | null) => {
                if (aStartMin === null || aEndMin === null || bStartMin === null || bEndMin === null) return false;
                return aStartMin === bStartMin && aEndMin === bEndMin;
            };

            // helper: check date-range overlap (inclusive)
            const dateOverlap = (aStart?: string | null, aEnd?: string | null, bStart?: string | null, bEnd?: string | null) => {
                if (!aStart || !aEnd || !bStart || !bEnd) return false;
                const aS = new Date(aStart).getTime();
                const aE = new Date(aEnd).getTime();
                const bS = new Date(bStart).getTime();
                const bE = new Date(bEnd).getTime();
                // overlap if ranges intersect
                return aS <= bE && aE >= bS;
            };

            // 2) Build map targetRoom -> list of moves for that room (only moves with to_room != null)
            const movesByRoom = new Map<number, MoveItem[]>();
            for (const m of moves) {
                if (m.to_room !== null) {
                    const arr = movesByRoom.get(m.to_room) ?? [];
                    arr.push(m);
                    movesByRoom.set(m.to_room, arr);
                }
            }

            // TURNOVER buffer not used for equality policy; keep 0
            const TURNOVER_BUFFER_MINUTES = 0;

            // For each target room, fetch potential conflicting shows (ignore date in selection) and check same-slot AND date-overlap
            for (const [roomId, movesForRoom] of movesByRoom.entries()) {
                if (!movesForRoom || movesForRoom.length === 0) continue;

                // Exclude moving IDs from candidates
                const excludeIds = ids;
                const excludePlaceholders = excludeIds.map(() => "?").join(",");

                // Fetch ALL existing shows in target room (exclude moving show ids) and lock rows
                const [candidatesRows] = await conn.query(
                    `SELECT s.showtime_id, s.start_date, s.end_date, s.room_id, s.movie_screen_id,
                  mc.start_time as screening_start, mc.end_time as screening_end
           FROM showtime s
           LEFT JOIN movie_screenings mc ON mc.movie_screen_id = s.movie_screen_id
           WHERE s.room_id = ?
             AND s.showtime_id NOT IN (${excludePlaceholders})
           FOR UPDATE`,
                    [roomId, ...excludeIds]
                );
                const candidates: any[] = Array.isArray(candidatesRows) ? (candidatesRows as any[]) : [];

                // move vs existing candidates
                for (const mv of movesForRoom) {
                    const mvWindow = timeById.get(mv.showtime_id);
                    if (!mvWindow) {
                        await conn.rollback();
                        return NextResponse.json({ ok: false, message: `Missing screening info for showtime ${mv.showtime_id}` }, { status: 500 });
                    }

                    const mvScreenId = mvWindow.movie_screen_id ?? null;
                    const mvStartMin = toMinutes(mvWindow.screeningStart ?? null);
                    const mvEndMin = toMinutes(mvWindow.screeningEnd ?? null);
                    const mvStartDate = mvWindow.startDate ?? null;
                    const mvEndDate = mvWindow.endDate ?? null;

                    for (const c of candidates) {
                        const cScreenId = (c as any).movie_screen_id ?? null;
                        const cStartMin = toMinutes((c as any).screening_start ?? null);
                        const cEndMin = toMinutes((c as any).screening_end ?? null);
                        const cStartDate = c.start_date ?? null;
                        const cEndDate = c.end_date ?? null;

                        // Policy: conflict IF
                        //  - both have movie_screen_id AND movie_screen_id equal AND date ranges overlap
                        //  OR
                        //  - fallback: both have valid start/end times AND both start & end match exactly AND date ranges overlap
                        let isConflict = false;
                        const datesOverlap = dateOverlap(mvStartDate, mvEndDate, cStartDate, cEndDate);

                        if (mvScreenId !== null && cScreenId !== null) {
                            if (mvScreenId === cScreenId && datesOverlap) isConflict = true;
                        } else {
                            if (exactTimeEqual(mvStartMin, mvEndMin, cStartMin, cEndMin) && datesOverlap) isConflict = true;
                        }

                        if (isConflict) {
                            await conn.rollback();
                            return NextResponse.json(
                                {
                                    ok: false,
                                    message: "Conflict detected in target room (same screening slot AND date overlap)",
                                    conflict: {
                                        target_room: roomId,
                                        move: {
                                            showtime_id: mv.showtime_id,
                                            to_room: mv.to_room,
                                            movie_screen_id: mvScreenId,
                                            screening_start: mvWindow.screeningStart,
                                            screening_end: mvWindow.screeningEnd,
                                            start_date: mvStartDate,
                                            end_date: mvEndDate,
                                        },
                                        conflicting_show: {
                                            showtime_id: c.showtime_id,
                                            movie_screen_id: c.movie_screen_id,
                                            screening_start: c.screening_start,
                                            screening_end: c.screening_end,
                                            start_date: c.start_date,
                                            end_date: c.end_date,
                                        },
                                        candidates_count: candidates.length,
                                    },
                                },
                                { status: 409 }
                            );
                        }
                    }
                }

                // pairwise among moves targeting same room (compare movie_screen_id first, else exact times) + date overlap
                for (let i = 0; i < movesForRoom.length; i++) {
                    const a = movesForRoom[i];
                    const aWindow = timeById.get(a.showtime_id);
                    if (!aWindow) {
                        await conn.rollback();
                        return NextResponse.json({ ok: false, message: `Missing screening info for showtime ${a.showtime_id}` }, { status: 500 });
                    }
                    const aScreenId = aWindow.movie_screen_id ?? null;
                    const aStartMin = toMinutes(aWindow.screeningStart ?? null);
                    const aEndMin = toMinutes(aWindow.screeningEnd ?? null);
                    const aStartDate = aWindow.startDate ?? null;
                    const aEndDate = aWindow.endDate ?? null;

                    for (let j = i + 1; j < movesForRoom.length; j++) {
                        const b = movesForRoom[j];
                        const bWindow = timeById.get(b.showtime_id);
                        if (!bWindow) {
                            await conn.rollback();
                            return NextResponse.json({ ok: false, message: `Missing screening info for showtime ${b.showtime_id}` }, { status: 500 });
                        }
                        const bScreenId = bWindow.movie_screen_id ?? null;
                        const bStartMin = toMinutes(bWindow.screeningStart ?? null);
                        const bEndMin = toMinutes(bWindow.screeningEnd ?? null);
                        const bStartDate = bWindow.startDate ?? null;
                        const bEndDate = bWindow.endDate ?? null;

                        const datesOverlap = dateOverlap(aStartDate, aEndDate, bStartDate, bEndDate);

                        let isConflict = false;
                        if (aScreenId !== null && bScreenId !== null) {
                            if (aScreenId === bScreenId && datesOverlap) isConflict = true;
                        } else {
                            if (exactTimeEqual(aStartMin, aEndMin, bStartMin, bEndMin) && datesOverlap) isConflict = true;
                        }

                        if (isConflict) {
                            await conn.rollback();
                            return NextResponse.json(
                                {
                                    ok: false,
                                    message: "Conflict detected between moves in the same batch (same screening slot AND date overlap)",
                                    conflict: { target_room: roomId, move_a: a, move_b: b },
                                },
                                { status: 409 }
                            );
                        }
                    }
                }
            }

            // 3) All checks passed -> perform updates
            for (const mv of moves) {
                await conn.query(`UPDATE showtime SET room_id = ? WHERE showtime_id = ?`, [mv.to_room, mv.showtime_id]);
            }

            // 4) Return updated rows (select)
            const [updatedRows] = await conn.query(
                `SELECT s.showtime_id, s.start_date, s.end_date, s.status, s.movie_id, s.room_id, m.name as movie_title, r.name as room_name
         FROM showtime s
         LEFT JOIN movies m ON m.movie_id = s.movie_id
         LEFT JOIN rooms r ON r.room_id = s.room_id
         WHERE s.showtime_id IN (${idPlaceholders})`,
                ids
            );

            await conn.commit();
            return NextResponse.json({ ok: true, updated: updatedRows }, { status: 200 });
        } catch (err) {
            try {
                await conn.rollback();
            } catch (_) { }
            console.error("move-batch error:", err);
            return NextResponse.json(
                { ok: false, message: "Internal server error", error: (err as any)?.message ?? String(err) },
                { status: 500 }
            );
        } finally {
            try {
                conn.release();
            } catch (_) { }
        }
    } catch (err) {
        console.error("move-batch outer error:", err);
        return NextResponse.json({ ok: false, message: "Bad request or server error" }, { status: 400 });
    }
}
