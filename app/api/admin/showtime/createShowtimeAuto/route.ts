// app/api/showtimes/create-with-day/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCinemaFromRoom } from "@/lib/axios/admin/roomAPI";
import { DATE_REGEX, DAY_TO_BINARY } from "@/lib/constant";
import { checkIsHoliday } from "@/lib/axios/admin/promotion_ruleAPI";
import { getDatesInRange } from "@/lib/function";

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

    const cinemaIdraw = await getCinemaFromRoom(room_id);
    const cinemaId = cinemaIdraw?.data?.[0]?.cinema_id ?? null;
    const d = new Date(date);
    const dayBinary = DAY_TO_BINARY[d.getDay()];
    const isHoliday = (await checkIsHoliday(date))?.data ? 1 : 0;
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        let showtimeId: number | null = null;
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
                // return NextResponse.json(
                //     {
                //         ok: false,
                //         code: "conflict",
                //         message: "Slot conflict",
                //         conflict: { target_room: room_id, show_date: date, movie_screen_id, conflicting: confRow },
                //     },
                //     { status: 409 }
                // );
                throw new Error(
                    `Trùng suất chiếu`
                );
            }
        }
        const [ins] = await conn.query(
            `INSERT INTO showtime (date, status, movie_id, room_id, movie_screen_id)
         VALUES (?, ?, ?, ?, ?)`,
            [date, status, movie_id, room_id, movie_screen_id]
        );
        showtimeId = Number((ins as any).insertId);

        const [seats]: any = await conn.query(`SELECT seat_id FROM seats WHERE room_id = ?`, [room_id]);
        if (Array.isArray(seats) && seats.length > 0) {
            const params: any[] = [];
            const placeholders: string[] = [];
            const defaultStatus = 0;
            for (const s of seats) {
                placeholders.push("(?,?,?)");
                params.push(s.seat_id, showtimeId, defaultStatus);
            }
            const sql = `insert into showtime_seat (seat_id,showtime_id,status) value ${placeholders.join(",")}`;
            await conn.query(sql, params);
        }
        //Tạo giá

        const [normalRows]: any = await conn.query(`SELECT price FROM price_fixed 
                WHERE
                cinema_id = ?
                AND ticket_type_id = ?
                AND day_of_week = ?
                AND is_blockbuster = ?
                AND is_holiday = ?
                AND (
                    (time_from < time_to AND ? BETWEEN time_from AND time_to)
                    OR
                    (time_from > time_to AND ? NOT BETWEEN time_to AND time_from)
                )
                ORDER BY
                is_holiday DESC,
                is_blockbuster DESC,
                day_of_week DESC,
                time_from DESC
                LIMIT 1;
                `, [cinemaId, 1, dayBinary, 0, isHoliday, date, date]);
        const priceNormal = normalRows?.[0]?.price;
        const [studentRows]: any = await conn.query(`SELECT price FROM price_fixed 
                WHERE
                cinema_id = ?
                AND ticket_type_id = ?
                AND day_of_week = ?
                AND is_blockbuster = ?
                AND is_holiday = ?
                AND (
                    (time_from < time_to AND ? BETWEEN time_from AND time_to)
                    OR
                    (time_from > time_to AND ? NOT BETWEEN time_to AND time_from)
                )
                ORDER BY
                is_holiday DESC,
                is_blockbuster DESC,
                day_of_week DESC,
                time_from DESC
                LIMIT 1;
                `, [cinemaId, 2, dayBinary, 0, isHoliday, date, date]);
        const priceStudent = studentRows?.[0]?.price;
        await conn.query(`INSERT INTO price_reality (
                price_promotion,
                price_final,
                ticket_type_id,
                showtime_id )
                VALUES (?,?,?,?);
                `, [0.00, priceNormal, 1, showtimeId]);
        await conn.query(`INSERT INTO price_reality (
                price_promotion,
                price_final,
                ticket_type_id,
                showtime_id )
                VALUES (?,?,?,?);
                `, [0.00, priceStudent, 2, showtimeId]);


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
