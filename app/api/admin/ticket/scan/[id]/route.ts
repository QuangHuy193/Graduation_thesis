import { db } from "@/lib/db";
import { errorResponse, successResponse } from "@/lib/function";

// quét vé cập nhật trạng thái đã lấy đồ ăn/đã vào xem
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    if (!id) {
      return errorResponse("Thiếu id", 400);
    }

    const [booking] = await db.query(
      `SELECT b.status 
      FROM ticket t JOIN booking b ON b.booking_id=t.booking_id 
      WHERE t.ticket_id=?`,
      [id]
    );

    if (booking[0].status === 1) {
      // booking đã thanh toán
      const [ticket] = await db.query(
        `SELECT status FROM ticket WHERE ticket_id = ?`,
        [id]
      );

      if (ticket[0].status === 1) {
        return successResponse(
          { scan: "scanner" },
          "Vé đã được quét trước đó rồi.",
          201
        );
      } else if (ticket[0].status === 2) {
        // đã lấy đồ ăn quét tiếp đi vào
        await db.query(`UPDATE ticket SET status = 1 WHERE ticket_id = ?`, [
          id,
        ]);
        return successResponse(
          { scan: "go" },
          "Quét thành công, mời vào cửa.",
          201
        );
      } else {
        // = 0 chưa quét
        const [food] = await db.query(
          `SELECT COUNT(ticket_id) AS count FROM food_order  WHERE ticket_id = ?`,
          [id]
        );
        if (food[0].count === 0) {
          // không có food, quét vào xem
          await db.query(`UPDATE ticket SET status = 1 WHERE ticket_id = ?`, [
            id,
          ]);
          return successResponse(
            { scan: "go" },
            "Quét thành công, mời vào cửa.",
            201
          );
        } else {
          //  có food, quét lấy food
          await db.query(`UPDATE ticket SET status = 3 WHERE ticket_id = ?`, [
            id,
          ]);
          // hiện danh sách food
          const [foods] = await db.query(
            `SELECT fo.quantity, f.name 
          FROM food_order fo JOIN foods f ON fo.food_id=f.food_id 
          WHERE fo.ticket_id = ?`,
            [id]
          );
          return successResponse(
            { scan: "food", foods: foods },
            "Quét thành công, mời nhận bắp nước.",
            201
          );
        }
      }
    } else {
      // booking đã hủy, hoàn tiền (hoặc chưa), chưa thanh toán
      return successResponse(
        { scan: "cancel" },
        "Vé chưa được thanh toán hoặc đã hủy!",
        201
      );
    }
  } catch (error) {
    return errorResponse("Lỗi server", 500);
  }
}
