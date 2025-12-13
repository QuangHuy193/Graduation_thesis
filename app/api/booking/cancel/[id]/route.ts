import { triggerRefund } from "@/lib/axios/paymentAPI";
import { db } from "@/lib/db";
import {
  errorResponse,
  getCurrentDateTime,
  successResponse,
} from "@/lib/function";

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }) {
  console.log("🔥 DELETE booking API hit");
  // return new Response("OK");
  try {
    // booking id
    const { id } = params;
    const { percent } = await req.json();
    // let percent: any;
    // try {
    //   percent = await req.json();
    // } catch (e) {
    //   console.log("❌ req.json() failed");
    //   return errorResponse("Body không hợp lệ", 400);
    // }

    // console.log("BODY:", percent);

    if (typeof percent !== "number" || percent < 0 || percent > 100) {
      return errorResponse("percent không hợp lệ", 400);
    }
    // (1) Lấy booking
    const [bookingRows] = await db.execute(
      "SELECT payment_method, status, showtime_id, user_id FROM booking WHERE booking_id = ?",
      [id]
    );

    if (bookingRows.length === 0)
      return errorResponse("Booking không tồn tại", 404);

    const booking = bookingRows[0];

    if (booking.status !== 1)
      return errorResponse("Booking không thể hủy", 400);

    // chuyển sang đang hoàn tiền
    await db.query(`UPDATE booking SET status = 3 WHERE booking_id = ?`, [id]);

    // lấy ra payment
    const [pmRows] = await db.execute(
      "SELECT amount FROM payment WHERE booking_id = ?",
      [id]
    );
    // tính toán thêm percent
    let totalRefund = pmRows[0]?.amount ?? 0;
    totalRefund = (totalRefund * percent) / 100;
    if (typeof percent !== "number") {
      return errorResponse("percent không hợp lệ", 400);
    }
    // console.log("getCurrentDateTime: ", getCurrentDateTime());
    console.log({
      percent,
      totalRefund,
      time: getCurrentDateTime(),
      booking_id: id
    });
    // gọi api hoàn trả
    if (booking.payment_method === "PAYOS") {
      const result = await triggerRefund();
      if (result.ok && result.data.status === "SUCCESS") {
        // console.log("Refund thành công!");

        await db.query(
          `INSERT into refund (percent, amount,time, reason,booking_id ) value (?,?,?,?,?)`,
          [percent, totalRefund, getCurrentDateTime() ?? null, "Người dùng hủy", id]
        );

        //  chuyển sang đã hủy
        await db.query(`UPDATE booking SET status = 4 WHERE booking_id = ?`, [
          id,
        ]);

        // chuyển trạng thái ghế
        const showtime_id = booking.showtime_id;
        console.log("showtime_id: ", showtime_id);
        /// Lấy danh sách seat_id
        const [ticketRows] = await db.execute(
          "SELECT seat_id FROM ticket WHERE booking_id = ?",
          [id]
        );

        const seatIds = ticketRows.map((t: any) => t.seat_id);

        /// Update ghế về trạng thái 0
        if (seatIds.length > 0) {
          await db.execute(
            `UPDATE showtime_seat
     SET status = 0
     WHERE showtime_id = ?
       AND seat_id IN (${seatIds.map(() => "?").join(",")})`,
            [showtime_id, ...seatIds]
          );
        }

        return successResponse({}, "Hủy booking thành công", 200);
      } else {
        console.log("Refund thất bại!", result);
        await db.query(`UPDATE booking SET status = 1 WHERE booking_id = ?`, [
          id,
        ]);
      }
    }
  } catch (error) {
    console.error(error);
    return errorResponse("Hủy booking thất bại", 500, error.message);
  }
}
