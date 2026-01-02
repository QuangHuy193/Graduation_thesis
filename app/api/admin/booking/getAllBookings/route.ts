import { NextResponse } from "next/server";
import { successResponse, errorResponse } from "@/lib/function";
import { db } from "@/lib/db";

export async function GET() {
    const pool = await db.getConnection();

    try {
        const query = `
    SELECT
        b.booking_id,
        b.total_price,
        b.booking_time,
        b.status,
        b.payment_method,
        b.refund_all,
        b.refund_all_time,
        b.user_id,
        b.voucher_id,
        b.showtime_id,

        u.name AS user_name,
        u.email AS user_email,

        s.date AS showtime_date,
        s.status AS showtime_status,

		m.name as movie_title,
		
		r.name as room_name,
		c.name as cinema_name,
		
		g.seat_column,
		g.seat_row
      FROM booking b
      LEFT JOIN users u ON u.user_id = b.user_id
      LEFT JOIN vouchers v ON v.voucher_id = b.voucher_id
      LEFT JOIN showtime s ON s.showtime_id = b.showtime_id
      left join movies m on s.movie_id=m.movie_id
      left join rooms r on s.room_id=r.room_id
      left join cinemas c on c.cinema_id=r.cinema_id
	  left join ticket t on t.booking_id=b.booking_id
	  left join seats g on g.seat_id=t.seat_id
    `;

        const [rows] = await pool.query(query);

        const map = new Map<number, any>();

        for (const r of rows as any[]) {
            const bookingId = Number(r.booking_id);

            if (!map.has(bookingId)) {
                const bookingTime = r.booking_time ? new Date(r.booking_time).toISOString() : null;
                const refundAllTime = r.refund_all_time ? new Date(r.refund_all_time).toISOString() : null;
                const showtimeDate = r.showtime_date
                    ? new Date(r.showtime_date).toISOString()
                    : null;

                map.set(bookingId, {
                    booking_id: bookingId,
                    total_price: Number(r.total_price),
                    booking_time: bookingTime,
                    status: Number(r.status),
                    payment_method: r.payment_method ?? null,
                    refund_all: r.refund_all === null ? null : Number(r.refund_all),
                    refund_all_time: refundAllTime,
                    voucher_id: r.voucher_id !== null ? Number(r.voucher_id) : null,

                    user: r.user_id
                        ? {
                            user_id: Number(r.user_id),
                            name: r.user_name || undefined,
                            email: r.user_email || undefined,
                        }
                        : null,

                    showtime: r.showtime_id
                        ? {
                            showtime_id: Number(r.showtime_id),
                            date: showtimeDate,
                            status: r.showtime_status !== null ? Number(r.showtime_status) : null,
                        }
                        : null,

                    movie: r.movie_title ?? null,
                    room: r.room_name ?? null,
                    cinema: r.cinema_name ?? null,

                    seats: [], // 🔥 mảng ghế
                });
            }

            // ✅ Add ghế nếu có
            if (r.seat_row && r.seat_column) {
                map.get(bookingId).seats.push({
                    seat_row: r.seat_row,
                    seat_column: r.seat_column,
                });
            }
        }

        const data = Array.from(map.values());


        return successResponse(
            { data, total: data.length },
            "success",
            200
        );
    } catch (err) {
        console.error("GET /api/admin/bookings error:", err);
        return errorResponse("Internal server error", 500);
    }
}
