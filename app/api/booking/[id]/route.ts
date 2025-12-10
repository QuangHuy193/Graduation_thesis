import { db } from "@/lib/db";
import QRCode from "qrcode";
import {
  errorResponse,
  getCurrentDateTime,
  successResponse,
} from "@/lib/function";

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { id } = await params;
    // ticket [{seat_id, ticket_type_id, price (giá vé), total_price (có bắp nước), food [{food_id, quanity}]}]
    const { total_price, payment_method, voucher_id, ticket } = body;

    // cập nhật booking

    if (total_price !== undefined) {
      await db.query(
        `UPDATE booking SET
        total_price = ?, payment_method = ?, status = 1, voucher_id = ?
        WHERE booking_id = ?`,
        [total_price, payment_method, voucher_id ?? null, id]
      );
      await db.query(
        `INSERT into payment (payment_time, amount, booking_id) value (?,?,?)`,
        [getCurrentDateTime(), total_price, id]
      );
    } else {
      //Lấy total price
      const [bookingRows] = await db.execute(
        `SELECT total_price FROM booking WHERE booking_id = ?`,
        [id]
      );

      if (!bookingRows || bookingRows.length === 0) {
        return errorResponse("Booking không tồn tại", 404);
      }

      const currentTotal = bookingRows[0].total_price ?? 0;

      await db.query(
        `UPDATE booking SET
        payment_method = ?, status = 1, voucher_id = ?
        WHERE booking_id = ?`,
        [payment_method, voucher_id ?? null, id]
      );

      if (currentTotal > 0) {
        await db.query(
          `INSERT INTO payment (payment_time, amount, booking_id) VALUE (?,?,?)`,
          [getCurrentDateTime(), currentTotal, id]
        );
      }
    }

    // cập nhật voucher nếu có
    if (voucher_id !== undefined) {
      await db.query(`UPDATE vouchers SET status = 1 WHERE voucher_id = ?`, [
        voucher_id,
      ]);
    }

    // tạo vé xem phim theo số lượng ghế gửi lên
    const createdTickets: Array<any> = [];

    // nếu có danh sách ticket (ghế) thì tạo từng vé
    // if (Array.isArray(ticket) && ticket.length > 0) {
    //   for (const t of ticket) {
    //     // đảm bảo các trường cần thiết
    //     const seat_id = t.seat_id ?? null;
    //     const ticket_type_id = t.ticket_type_id ?? null;
    //     const price = t.price ?? 0;
    //     const t_total_price = t.total_price ?? price; // nếu có thêm đồ ăn cộng vào

    //     // 1) Insert ticket ban đầu với qr_code NULL (chưa generate)
    //     const [insertResult] = await db.query(
    //       `INSERT INTO ticket (booking_id, seat_id, ticket_type_id, price, total_price)
    //        VALUES (?, ?, ?, ?, ?)`,
    //       [id, seat_id, ticket_type_id, price, t_total_price]
    //     );

    //     // lấy ticket_id vừa tạo
    //     const ticketId = insertResult.insertId;

    //     // 2) Nếu ticket có phần food (mảng {food_id, quantity}) thì lưu vào ticket_foods
    //     if (Array.isArray(t.food) && t.food.length > 0) {
    //       for (const f of t.food) {
    //         const food_id = f.food_id ?? null;
    //         const quantity = f.quantity ?? 0;
    //         if (food_id !== null && quantity > 0) {
    //           await db.query(
    //             `INSERT INTO food_order (ticket_id, food_id, quantity) VALUES (?, ?, ?)`,
    //             [ticketId, food_id, quantity]
    //           );
    //         }
    //       }
    //     }

    //     // lấy label ghế cho qr
    //     const [seatRow] = await db.query(
    //       `SELECT seat_row, seat_column FROM seats WHERE seat_id = ?`,
    //       [seat_id]
    //     );

    //     // lấy food cho qr
    //     const [foodRow] = await db.query(
    //       `SELECT f.name, fo.quantity
    //       FROM food_order fo
    //       JOIN foods f ON f.food_id = fo.food_id
    //       JOIN ticket t ON t.ticket_id = fo.ticket_id
    //       WHERE fo.ticket_id = ?`,
    //       [ticketId]
    //     );

    //     //lấy giờ phòng cho qr
    //     const [bookingInfo] = await db.query(
    //       `SELECT ms.start_time, r.name
    //       FROM booking b
    //       JOIN showtime s ON b.showtime_id = s.showtime_id
    //       JOIN rooms r ON r.room_id = s.room_id
    //       JOIN movie_screenings ms ON ms.movie_screen_id = s.movie_screen_id
    //       WHERE s.showtime_id = ?`,
    //       [id]
    //     );

    //     // 3) Tạo nội dung QR (có thể chứa ticketId, bookingId, expire, và 1 hash nếu muốn)
    //     // Tạo payload QR (chỉ chứa ticketId nếu muốn bảo mật)
    //     const qrPayload = JSON.stringify({
    //       ticketId, // bắt buộc để server xác thực
    //       seat: seatRow.seat_row + seatRow.seat_column,
    //       startTime: bookingInfo.start_time,
    //       room: bookingInfo.room_name,
    //       foods: foodRow,
    //     });

    //     // 4) Generate QR code dưới dạng data URL (PNG)
    //     const qrDataUrl = await QRCode.toDataURL(qrPayload, {
    //       type: "image/png",
    //     });

    //     // 5) Cập nhật record ticket với qr_code
    //     await db.query(`UPDATE ticket SET qr_code = ? WHERE ticket_id = ?`, [
    //       qrDataUrl,
    //       ticketId,
    //     ]);

    //     // push thông tin vé đã tạo để trả về (tránh trả về qrDataUrl lớn nếu không cần)
    //     createdTickets.push({
    //       ticket_id: ticketId,
    //     });
    //   }
    // }

    if (Array.isArray(ticket) && ticket.length > 0) {
      for (const t of ticket) {
        try {
          const seat_id = t.seat_id ?? null;
          const ticket_type_id = t.ticket_type_id ?? null;
          const price = t.price ?? 0;
          const t_total_price = t.total_price ?? price;

          // 1) Insert ticket (qr_code null trước)
          const [insertResult] = await db.execute(
            `INSERT INTO ticket (booking_id, seat_id, ticket_type_id, price, total_price)
         VALUES (?, ?, ?, ?, ?)`,
            [id, seat_id, ticket_type_id, price, t_total_price]
          );
          const ticketId = insertResult.insertId ?? insertResult[0]?.insertId;
          if (!ticketId) {
            console.error("Không lấy được insertId khi tạo ticket", insertResult);
            continue;
          }

          // 2) Lưu food nếu có
          if (Array.isArray(t.food) && t.food.length > 0) {
            for (const f of t.food) {
              const food_id = f.food_id ?? null;
              const quantity = f.quantity ?? 0;
              if (food_id !== null && quantity > 0) {
                await db.execute(
                  `INSERT INTO food_order (ticket_id, food_id, quantity) VALUES (?, ?, ?)`,
                  [ticketId, food_id, quantity]
                );
              }
            }
          }

          // 3) Lấy label ghế (nếu có seat_id)
          let seatLabel = null;
          if (seat_id !== null) {
            const [seatRows] = await db.execute(
              `SELECT seat_row, seat_column FROM seats WHERE seat_id = ?`,
              [seat_id]
            );
            if (Array.isArray(seatRows) && seatRows.length > 0) {
              const seat = seatRows[0];
              seatLabel = `${seat.seat_row}${seat.seat_column}`;
            } else {
              console.warn("Không tìm thấy seat cho seat_id=", seat_id);
            }
          }

          // 4) Lấy food order để show trong QR (nếu cần)
          const [foodRows] = await db.execute(
            `SELECT f.name, fo.quantity
         FROM food_order fo
         JOIN foods f ON f.food_id = fo.food_id
         WHERE fo.ticket_id = ?`,
            [ticketId]
          );

          // 5) Lấy thông tin start_time, room (dùng booking_id đúng)
          const [bookingInfoRows] = await db.execute(
            `SELECT ms.start_time, r.name AS room_name
         FROM booking b
         JOIN showtime s ON b.showtime_id = s.showtime_id
         JOIN rooms r ON r.room_id = s.room_id
         JOIN movie_screenings ms ON ms.movie_screen_id = s.movie_screen_id
         WHERE b.booking_id = ?`,
            [id]
          );
          const bookingInfo = Array.isArray(bookingInfoRows) && bookingInfoRows.length > 0 ? bookingInfoRows[0] : null;

          // 6) Tạo payload QR (an toàn hơn: chỉ include id + minimal info)
          const qrPayload = JSON.stringify({
            ticketId,
            bookingId: id,
            seat: seatLabel,
            startTime: bookingInfo?.start_time ?? null,
            room: bookingInfo?.room_name ?? null,
            foods: Array.isArray(foodRows) ? foodRows : []
          });

          // 7) Generate QR
          const qrDataUrl = await QRCode.toDataURL(qrPayload, { type: "image/png" });

          // 8) Update ticket với qr_code
          await db.execute(
            `UPDATE ticket SET qr_code = ? WHERE ticket_id = ?`,
            [qrDataUrl, ticketId]
          );

          createdTickets.push({ ticket_id: ticketId });
        } catch (err) {
          // Không throw toàn bộ, chỉ log để tiếp tục tạo ticket khác
          console.error("Lỗi khi tạo ticket item:", err);
        }
      }
    }
    return successResponse(
      // {
      //   booking_id: id,
      // }
      createdTickets,
      "Cập nhật booking thành công",
      201
    );
  } catch (error) {
    console.error(error);
    return errorResponse("Cập nhật booking thất bại", 500, error.message);
  }
}
