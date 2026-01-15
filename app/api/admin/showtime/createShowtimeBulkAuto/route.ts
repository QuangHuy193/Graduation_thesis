// app/api/showtimes/create-with-day/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCinemaFromRoom } from "@/lib/axios/admin/roomAPI";
import { DATE_REGEX, DAY_TO_BINARY } from "@/lib/constant";
import { checkIsHoliday } from "@/lib/axios/admin/promotion_ruleAPI";
import { getDatesInRange } from "@/lib/function";
// import { successResponse, errorResponse } from "@/lib/function";
export async function POST(req: Request) {
    const body = await req.json().catch(() => null);
    if (!body) {
        return NextResponse.json({ ok: false, message: "Empty body" }, { status: 400 });
    }

    const {
        items,
        from_date,
        to_date,
        status = 1,
        _temp_client_id = null,
        user_id,
    } = body as {
        from_date?: string;
        to_date?: string;
        items?: Array<{
            movie_id: number;
            room_id: number;
            movie_screen_id: number;
        }>;
        status?: number;
        _temp_client_id?: number | null;
        user_id?: number;
    };


    // Basic validation
    if (!Array.isArray(items) || items.length === 0) {
        return NextResponse.json(
            { ok: false, message: "items must be a non-empty array" },
            { status: 400 }
        );
    }

    if (from_date && !DATE_REGEX.test(from_date)) {
        return NextResponse.json(
            { ok: false, message: "from_date must be YYYY-MM-DD" },
            { status: 400 }
        );
    }

    if (to_date && !DATE_REGEX.test(to_date)) {
        return NextResponse.json(
            { ok: false, message: "to_date must be YYYY-MM-DD" },
            { status: 400 }
        );
    }
    if (from_date && to_date) {
        if (new Date(from_date) > new Date(to_date)) {
            return NextResponse.json(
                { ok: false, message: "from_date must be <= to_date" },
                { status: 400 }
            );
        }
    }

    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        const dates = getDatesInRange(from_date!, to_date!);
        const createdShowtimes: any[] = [];

        for (const item of items) {
            const { movie_id, room_id, movie_screen_id } = item;

            if (!movie_id || !room_id || !movie_screen_id) {
                throw new Error("Invalid item in bulk payload");
            }

            const cinemaIdraw = await getCinemaFromRoom(room_id);
            const cinemaId = cinemaIdraw?.data?.[0]?.cinema_id ?? null;

            for (const date of dates) {

                // 1️⃣ CHECK CONFLICT
                const [conf] = await conn.query(
                    `SELECT showtime_id FROM showtime
       WHERE room_id = ? AND date = ? AND movie_screen_id = ? AND status = 1
       LIMIT 1 FOR UPDATE`,
                    [room_id, date, movie_screen_id]
                );

                if ((conf as any[]).length > 0) {
                    // throw new Error(
                    //     `Slot conflict at ${date} (room ${room_id}, screen ${movie_screen_id})`
                    // );
                    const [roomRows]: any = await conn.query(`select name from rooms where room_id=?`, [room_id]);
                    const roomName = roomRows[0].name;
                    const [screenRows]: any = await conn.query(`select start_time,end_time from movie_screenings where movie_screen_id=?`, [movie_screen_id]);
                    const start_time = screenRows[0].start_time;
                    const end_time = screenRows[0].end_time;
                    throw new Error(
                        `Có suất bị trùng vào ngày ${date}, ${roomName}, suất [${start_time} - ${end_time}]`
                    );
                }

                // 2️⃣ INSERT SHOWTIME
                const [ins] = await conn.query(
                    `INSERT INTO showtime (date, status, movie_id, room_id, movie_screen_id,user_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
                    [date, status, movie_id, room_id, movie_screen_id, user_id]
                );

                const showtimeId = Number((ins as any).insertId);

                // 3️⃣ CREATE SEATS
                const [seats]: any = await conn.query(
                    `SELECT seat_id FROM seats WHERE room_id = ?`,
                    [room_id]
                );

                if (Array.isArray(seats) && seats.length > 0) {
                    const params: any[] = [];
                    const placeholders: string[] = [];

                    for (const s of seats) {
                        placeholders.push("(?,?,?)");
                        params.push(s.seat_id, showtimeId, 0);
                    }

                    await conn.query(
                        `INSERT INTO showtime_seat (seat_id, showtime_id, status)
         VALUES ${placeholders.join(",")}`,
                        params
                    );
                }

                // 4️⃣ PRICE
                const d = new Date(date);
                const dayBinary = DAY_TO_BINARY[d.getDay()];
                const isHoliday = (await checkIsHoliday(date))?.data ? 1 : 0;

                const [normalRows]: any = await conn.query(
                    `SELECT price FROM price_fixed
       WHERE cinema_id = ?
         AND ticket_type_id = 1
         AND day_of_week = ?
         AND is_blockbuster = 0
         AND is_holiday = ?
       LIMIT 1`,
                    [cinemaId, dayBinary, isHoliday]
                );

                const [studentRows]: any = await conn.query(
                    `SELECT price FROM price_fixed
       WHERE cinema_id = ?
         AND ticket_type_id = 2
         AND day_of_week = ?
         AND is_blockbuster = 0
         AND is_holiday = ?
       LIMIT 1`,
                    [cinemaId, dayBinary, isHoliday]
                );

                await conn.query(
                    `INSERT INTO price_reality (price_promotion, price_final, ticket_type_id, showtime_id)
       VALUES (0, ?, 1, ?), (0, ?, 2, ?)`,
                    [
                        normalRows?.[0]?.price ?? 0,
                        showtimeId,
                        studentRows?.[0]?.price ?? 0,
                        showtimeId,
                    ]
                );

                createdShowtimes.push({
                    showtime_id: showtimeId,
                    date,
                    movie_id,
                    room_id,
                    movie_screen_id,
                });
            }
        }

        await conn.commit();
        return NextResponse.json(
            {
                ok: true,
                created_count: createdShowtimes.length,
                showtimes: createdShowtimes,
                _temp_client_id,
            },
            { status: 200 }
        );



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
