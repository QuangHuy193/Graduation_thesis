// app/api/showtime-days/route.ts
import { NextResponse } from "next/server";
import { successResponse, errorResponse } from "@/lib/function";
import { db } from "@/lib/db";

const MAX_RANGE_DAYS = 90;
const DEFAULT_WINDOW = 15;

function isIsoDate(s?: string | null) {
    return !!s && /^\d{4}-\d{2}-\d{2}$/.test(s);
}

function todayVN() {
    return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Ho_Chi_Minh" }); // YYYY-MM-DD
}

function addDaysISO(d: string, days: number) {
    const dt = new Date(d + "T00:00:00");
    dt.setDate(dt.getDate() + days);
    return dt.toISOString().slice(0, 10);
}

function diffDays(a: string, b: string) {
    const A = new Date(a + "T00:00:00");
    const B = new Date(b + "T00:00:00");
    const diff = Math.floor((B.getTime() - A.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
}

// format possible Date or string -> YYYY-MM-DD
function toYYYYMMDD(v: any) {
    if (!v) return null;
    if (typeof v === "string") {
        // sometimes MySQL returns "2025-12-04" or "2025-12-04T00:00:00.000Z"
        return v.slice(0, 10);
    }
    // Date object
    return (
        v.getFullYear() +
        "-" +
        String(v.getMonth() + 1).padStart(2, "0") +
        "-" +
        String(v.getDate()).padStart(2, "0")
    );
}

export async function GET(req: Request) {
    const url = new URL(req.url);
    let from = url.searchParams.get("from");
    let to = url.searchParams.get("to");

    // default window
    const today = todayVN();

    if (!isIsoDate(from) && !isIsoDate(to)) {
        // neither provided -> default window from today
        from = today;
        to = addDaysISO(from, DEFAULT_WINDOW - 1);
    } else if (isIsoDate(from) && !isIsoDate(to)) {
        // from provided, to default from + window-1
        to = addDaysISO(from!, DEFAULT_WINDOW - 1);
    } else if (!isIsoDate(from) && isIsoDate(to)) {
        // to provided, from = to - window +1
        from = addDaysISO(to!, - (DEFAULT_WINDOW - 1));
    }

    // now both should be present, validate
    if (!isIsoDate(from) || !isIsoDate(to)) {
        return new Response(
            JSON.stringify({ error: "Invalid `from` or `to`. Expect format YYYY-MM-DD." }),
            { status: 400 }
        );
    }

    // ensure from <= to
    if (from > to) {
        return new Response(JSON.stringify({ error: "`from` must be <= `to`" }), { status: 400 });
    }

    // protect range size
    const span = diffDays(from, to) + 1;
    if (span > MAX_RANGE_DAYS) {
        return new Response(
            JSON.stringify({ error: `Range too large. Max ${MAX_RANGE_DAYS} days allowed.` }),
            { status: 400 }
        );
    }

    const conn = await db.getConnection();
    try {
        const sql = `
     SELECT
        sd.id AS id,
        sd.showtime_id,
        sd.movie_id,
        sd.room_id,
        sd.show_date,
        sd.movie_screen_id,
        sd.status AS sd_status,

        s.start_date AS s_start_date,
        s.end_date AS s_end_date,
        s.status AS s_status,

        m.name AS movie_title,
        r.name AS room_name,
        ms.start_time AS screening_start,
        ms.end_time AS screening_end,
        c.name AS cinema_name
      FROM showtime_days sd
      LEFT JOIN showtime s ON s.showtime_id = sd.showtime_id
      LEFT JOIN movies m ON m.movie_id = sd.movie_id
      LEFT JOIN rooms r ON r.room_id = sd.room_id
      LEFT JOIN movie_screenings ms ON ms.movie_screen_id = sd.movie_screen_id
      LEFT JOIN cinemas c ON c.cinema_id = r.cinema_id
      WHERE sd.show_date BETWEEN ? AND ?
      ORDER BY sd.show_date ASC, sd.room_id ASC, sd.movie_screen_id ASC
    `;

        const [rows] = await conn.query(sql, [from, to]);

        const data = (rows as any[]).map((r) => ({
            id: Number(r.id),
            showtime_id: r.showtime_id === null ? null : Number(r.showtime_id),
            movie_id: r.movie_id === null ? null : Number(r.movie_id),
            room_id: r.room_id === null ? null : Number(r.room_id),
            show_date: toYYYYMMDD(r.show_date),
            movie_title: r.movie_title || null,
            room_name: r.room_name || null,
            movie_screen_id: r.movie_screen_id === null ? null : Number(r.movie_screen_id),
            screening_start: r.screening_start || null,
            screening_end: r.screening_end || null,
            cinema_name: r.cinema_name || null,
            status: r.sd_status === null ? null : r.sd_status, // keep original type, or Number(...)
            // optional: include parent showtime's start/end if useful
            showtime_start_date: r.s_start_date ? toYYYYMMDD(r.s_start_date) : null,
            showtime_end_date: r.s_end_date ? toYYYYMMDD(r.s_end_date) : null
        }));

        return successResponse({ data, total: data.length }, "success", 200);
    } catch (err) {
        console.error("GET /api/showtime-days error:", err);
        return errorResponse("Internal server error", 500);
    } finally {
        try {
            if (conn?.release) await conn.release();
        } catch (e) {
            console.warn("release failed", e);
        }
    }
}
