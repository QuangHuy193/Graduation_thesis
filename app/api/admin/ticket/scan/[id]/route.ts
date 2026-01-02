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

    const [ticket] = await db.query(
      `SELECT status FROM ticket WHERE ticket_id = ?`,
      [id]
    );

    if (ticket[0].status === 3) {
      // đã lấy đồ ăn quét tiếp đi vào
      await db.query(`UPDATE ticket SET status = 1 WHERE ticket_id = ?`, [id]);
      return successResponse({ scan: "go" }, "Cập nhật thành công", 201);
    } else if (ticket[0].status === 0) {
      //  chưa quét
      const [food] = await db.query(
        `SELECT COUNT(ticket_id) AS count FROM food_order  WHERE ticket_id = ?`,
        [id]
      );

      if (food[0].count === 0) {
        // không có food, quét vào xem
        await db.query(`UPDATE ticket SET status = 1 WHERE ticket_id = ?`, [
          id,
        ]);
        return successResponse({ scan: "go" }, "Cập nhật thành công", 201);
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
          "Cập nhật thành công",
          201
        );
      }
    } else if (ticket[0].status === 1) {
      return successResponse({ scan: "scanner" }, "Cập nhật thành công", 201);
    } else {
      return successResponse({ scan: "cancel" }, "Cập nhật thành công", 201);
    }
  } catch (error) {
    return errorResponse("Lỗi server", 500);
  }
}
