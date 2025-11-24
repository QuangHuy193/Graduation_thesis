import { db } from "@/lib/db";
import QRCode from "qrcode";
import { errorResponse, successResponse } from "@/lib/function";

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
    } else {
      await db.query(
        `UPDATE booking SET
        payment_method = ?, status = 1, voucher_id = ?
        WHERE booking_id = ?`,
        [payment_method, voucher_id ?? null, id]
      );
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
    if (Array.isArray(ticket) && ticket.length > 0) {
      for (const t of ticket) {
        // đảm bảo các trường cần thiết
        const seat_id = t.seat_id ?? null;
        const ticket_type_id = t.ticket_type_id ?? null;
        const price = t.price ?? 0;
        const t_total_price = t.total_price ?? price; // nếu có thêm đồ ăn cộng vào

        // 1) Insert ticket ban đầu với qr_code NULL (chưa generate)
        const [insertResult] = await db.query(
          `INSERT INTO ticket (booking_id, seat_id, ticket_type_id, price, total_price)
           VALUES (?, ?, ?, ?, ?)`,
          [id, seat_id, ticket_type_id, price, t_total_price]
        );

        // lấy ticket_id vừa tạo
        const ticketId = insertResult.insertId;

        // 2) Tạo nội dung QR (có thể chứa ticketId, bookingId, expire, và 1 hash nếu muốn)
        // Bạn có thể thêm nhiều thông tin hơn (vd: seat, movie_id, showtime) tuỳ nhu cầu
        const qrPayload = JSON.stringify({
          ticketId,
          bookingId: id,
          seatId: seat_id,
          issuedAt: new Date().toISOString(),
        });

        // 3) Generate QR code dưới dạng data URL (PNG)
        const qrDataUrl = await QRCode.toDataURL(qrPayload, {
          type: "image/png",
        });

        // 4) Cập nhật record ticket với qr_code
        await db.query(`UPDATE ticket SET qr_code = ? WHERE ticket_id = ?`, [
          qrDataUrl,
          ticketId,
        ]);

        // 5) Nếu ticket có phần food (mảng {food_id, quantity}) thì lưu vào ticket_foods
        if (Array.isArray(t.food) && t.food.length > 0) {
          for (const f of t.food) {
            const food_id = f.food_id ?? null;
            const quantity = f.quantity ?? 0;
            if (food_id !== null && quantity > 0) {
              await db.query(
                `INSERT INTO food_order (ticket_id, food_id, quantity) VALUES (?, ?, ?)`,
                [ticketId, food_id, quantity]
              );
            }
          }
        }

        // push thông tin vé đã tạo để trả về (tránh trả về qrDataUrl lớn nếu không cần)
        createdTickets.push({
          ticket_id: ticketId,
        });
      }
    }

    return successResponse(
      {
        booking_id: id,
      },
      "Cập nhật booking thành công",
      201
    );
  } catch (error) {
    console.error(error);
    return errorResponse("Cập nhật booking thất bại", 500, error.message);
  }
}
