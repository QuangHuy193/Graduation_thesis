import { triggerRefund } from "@/lib/axios/paymentAPI";
import { db } from "@/lib/db";
import { errorResponse, getCurrentDateTime, successResponse } from "@/lib/function";

export async function DELETE(req: Request, { params }: { params: string }) {
  try {
    // booking id
    const { id } = await params;
    const { percent } = await req.json();

    // (1) Lấy booking
    const [bookingRows] = await db.execute(
      "SELECT payment_method, status, showtime_id FROM booking WHERE booking_id = ?",
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

    // gọi api hoàn trả
    if (booking.payment_method === "payos") {
      const result = await triggerRefund();
      if (result.ok && result.data.status === "SUCCESS") {
        console.log("Refund thành công!");
        await db.query(`INSERT into refund (percent, amount,time,booking_id ) value (?,?,?,?)`, [percent, totalRefund, getCurrentDateTime(), id]);
        //  chuyển sang đã hủy
        await db.query(`UPDATE booking SET status = 4 WHERE booking_id = ?`, [id]);
        //

        // chuyển trạng thái ghế
        const showtime_id = booking.showtime_id;

        /// Lấy danh sách seat_id
        const [ticketRows] = await db.execute(
          "SELECT seat_id FROM ticket WHERE booking_id = ?",
          [id]
        );

        const seatIds = ticketRows.map((t: any) => t.seat_id);

        /// Update ghế về trạng thái 0
        await db.execute(
          `UPDATE showtime_seat 
     SET status = 0 
     WHERE showtime_id = ? 
       AND seat_id IN (${seatIds.map(() => "?").join(",")})`,
          [showtime_id, ...seatIds]
        );

        return successResponse({}, "Hủy booking thành công", 200);
      } else {
        console.log("Refund thất bại!", result);
        await db.query(`UPDATE booking SET status = 4 WHERE booking_id = ?`, [id]);
      }
    }
    // TODO thành công thì làm
    // TODO thất bại thì trả về booking status về lại 1
    // tạo bảng refund
    // await db.query(`INSERT into refund (percent, amount,time,booking_id ) value (?,?,?,?)`, [percent, totalRefund, getCurrentDateTime(), id]);


  } catch (error) {
    console.error(error);
    return errorResponse("Hủy booking thất bại", 500, error.message);
  }
}
