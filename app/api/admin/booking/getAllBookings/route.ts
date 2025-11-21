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

        s.start_date AS showtime_start_date,
        s.end_date AS showtime_end_date,
        s.status AS showtime_status

      FROM booking b
      LEFT JOIN users u ON u.user_id = b.user_id
      LEFT JOIN vouchers v ON v.voucher_id = b.voucher_id
      LEFT JOIN showtime s ON s.showtime_id = b.showtime_id
    `;

        const [rows] = await pool.query(query);

        const data = (rows as any[]).map((r) => {
            const bookingTime = r.booking_time ? new Date(r.booking_time).toISOString() : null;
            const refundAllTime = r.refund_all_time ? new Date(r.refund_all_time).toISOString() : null;

            const showtimeStart = r.showtime_start_date
                ? new Date(r.showtime_start_date).toISOString()
                : null;

            const showtimeEnd = r.showtime_end_date
                ? new Date(r.showtime_end_date).toISOString()
                : null;

            const user = r.user_id
                ? {
                    user_id: Number(r.user_id),
                    name: r.user_name || undefined,
                    email: r.user_email || undefined,
                }
                : null;

            const showtime = r.showtime_id
                ? {
                    showtime_id: Number(r.showtime_id),
                    start_time: showtimeStart,
                    end_time: showtimeEnd,
                    status: r.showtime_status !== null ? Number(r.showtime_status) : null,
                }
                : null;

            return {
                booking_id: Number(r.booking_id),
                total_price: Number(r.total_price),
                booking_time: bookingTime,
                status: Number(r.status),
                payment_method: r.payment_method ?? null,
                refund_all: r.refund_all === null ? null : Number(r.refund_all),
                refund_all_time: refundAllTime,
                user,
                voucher_id: r.voucher_id !== null ? Number(r.voucher_id) : null,
                showtime,
                seats: [], // chưa có bảng ghế => trả rỗng để FE không lỗi
            };
        });

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
