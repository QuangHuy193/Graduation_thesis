import { db } from "@/lib/db";
import { successResponse, errorResponse, getRefundPercent, getCurrentDateTime } from "@/lib/function";
export async function POST(
    req: Request,
    { params }: { params: { id: string } }
) {
    const { id } = await params;
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        const [rows]: any = await conn.query(`SELECT status, showtime_id, user_id from booking WHERE booking_id=?`, [id]);
        const status = rows[0].status;
        console.log("status: ", status);
        if (status === 1) {
            await conn.query(`UPDATE booking set status =3 WHERE booking_id=?`, [id]);
            const showtime_id = rows[0].showtime_id;
            const user_id = rows[0].user_id;

            const [showtimeRows]: any = await conn.query(`SELECT s.date,ms.start_time from showtime s 
	LEFT join movie_screenings ms on ms.movie_screen_id=s.movie_screen_id 
	WHERE showtime_id=?`, [showtime_id]);
            const date = showtimeRows[0].date;
            const time = showtimeRows[0].start_time;

            const [paymentRows]: any = await conn.query(`SELECT amount from payment where booking_id=?`, [id]);
            const amount = paymentRows[0].amount;

            let vip = 0;
            if (user_id) {
                const [userRows]: any = await conn.query(`SELECT vip from users WHERE user_id=?`, [user_id]);
                vip = userRows[0].vip;
            }

            const refundPercent = getRefundPercent(date, time, vip);
            if (typeof refundPercent !== "number") {
                return errorResponse("percent không hợp lệ", 400);
            }
            // tính toán thêm percent
            let totalRefund = amount ?? 0;

            totalRefund = (totalRefund * refundPercent) / 100;

            const currentTime = getCurrentDateTime();
            await conn.query(`INSERT INTO refund (percent, amount, time, reason, booking_id) VALUES (?, ?,?,'Hủy từ hệ thống',? )`, [refundPercent, totalRefund, currentTime, id]);
            await conn.query(`UPDATE booking set status =4 WHERE booking_id=?`, [id]);
            await conn.commit();
            return successResponse([], "true", 201);
        } else {
            await conn.rollback();
            return errorResponse("Không thể hoàn tiền", 400);
        }
    } catch (error) {
        // await conn.query(`UPDATE booking set status =1 WHERE booking_id=?`, [id]);
        await conn.rollback();
        return errorResponse("Lỗi server", 500);
    } finally {
        await conn.release();
    }
}