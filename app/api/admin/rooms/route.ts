import { db } from "@/lib/db";
import { successResponse, errorResponse, numberToLetter } from "@/lib/function";

export async function POST(req: Request) {
  const connection = await db.getConnection();

  try {
    const body = await req.json();
    const { name, width, height, capacity, cinemaId, aside_gap } = body;

    await connection.beginTransaction();

    // kiểm tra trùng tên phòng trong cùng rạp
    const [exist]: any = await connection.execute(
      `SELECT room_id 
      FROM rooms 
      WHERE name = ? AND cinema_id = ?
      LIMIT 1`,
      [name, cinemaId]
    );

    if (exist.length > 0) {
      await connection.rollback();
      return errorResponse("Tên phòng đã tồn tại trong rạp này", 400);
    }

    // 1 Insert room
    const [insertRoom]: any = await connection.execute(
      `INSERT INTO rooms (name, width, height, capacity, status, cinema_id)
       VALUES (?,?,?,?,?,?)`,
      [name, width, height, capacity, 1, cinemaId]
    );

    const roomId = insertRoom.insertId;

    // ===== Chuẩn hóa aside theo từng hàng =====
    const asideMap: Record<number, any[]> = {};
    aside_gap?.forEach((row: any) => {
      asideMap[row.gap_row] = row.aside;
    });

    // 2 Insert aside_gap
    if (aside_gap && aside_gap.length > 0) {
      const asideValues: any[] = [];

      aside_gap.forEach((row: any) => {
        row.aside.forEach((gap: any) => {
          asideValues.push([row.gap_row, gap.gap_index, gap.gap_width, roomId]);
        });
      });

      if (asideValues.length > 0) {
        await connection.query(
          `INSERT INTO asile_gap (gap_row, gap_index, gap_width, room_id)
           VALUES ?`,
          [asideValues]
        );
      }
    }

    // 3 Insert seats
    const seatValues: any[] = [];

    for (let r = 0; r < height; r++) {
      const rowLetter = numberToLetter(r);
      const rowNumber = r + 1;
      const gaps = asideMap[rowNumber] || [];

      let seatCol = 0;

      for (let c = 1; c <= width; c++) {
        const isGap = gaps.some(
          (g) => c >= g.gap_index && c < g.gap_index + g.gap_width
        );

        if (isGap) continue;

        seatCol += 1;

        seatValues.push([rowLetter, seatCol, roomId]);
      }
    }

    if (seatValues.length > 0) {
      await connection.query(
        `INSERT INTO seats (seat_row, seat_column, room_id)
         VALUES ?`,
        [seatValues]
      );
    }

    await connection.commit();

    return successResponse(
      { room_id: roomId, total_seat: seatValues.length },
      "Tạo phòng thành công",
      200
    );
  } catch (error) {
    await connection.rollback();
    console.error(error);
    return errorResponse("Tạo phòng thất bại", 400);
  } finally {
    connection.release();
  }
}
