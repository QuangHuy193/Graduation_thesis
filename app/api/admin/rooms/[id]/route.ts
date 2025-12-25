import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/function";

function isGap(col, gaps = []) {
  return gaps.some((g) => col >= g.start && col < g.start + g.width);
}

function generateSeats(width, height, asideMap) {
  const seats = [];

  for (let r = 0; r < height; r++) {
    const rowIndex = r + 1;
    const rowChar = String.fromCharCode(65 + r); // A,B,C...

    const gaps = asideMap.get(rowIndex) || [];
    console.log(rowIndex, " gaps ", gaps);
    let seatNumber = 1;

    for (let col = 1; col <= width; col++) {
      if (isGap(col, gaps)) continue;

      seats.push({
        row: rowChar,
        col: seatNumber++,
      });
    }
  }

  return seats;
}

// xóa phòng
export async function DELETE(req: Request, { params }: { params: string }) {
  try {
    // id phòng
    const { id } = await params;
    const body = await req.json();
    // type = 0: xóa bình thường (mặc định)
    // type = 1: xóa hủy lịch chiếu
    // type = 2: xóa hủy lịch hoàn tiền
    const { type } = body;

    if (type === undefined) {
      console.log("Thiếu type");
      return errorResponse("Xóa phòng lỗi", 400);
    }

    // có lịch chiếu chưa có booking
    if (type === 1) {
      await db.execute(`UPDATE rooms SET status = 0 WHERE room_id = ?`, [id]);
      await db.execute(`UPDATE showtime SET status = 0 WHERE room_id = ?`, [
        id,
      ]);
      return successResponse([], "Chuyển trạng thái phòng thành công", 200);
    }

    // TODO
    // có lịch chiếu, có booking
    if (type === 2) {
      const connection = await db.getConnection();
      await connection.beginTransaction();

      const [showtimes] = await db.query(
        `SELECT showtime_id FROM showtime WHERE room_id = ?`,
        [id]
      );

      await connection.commit();
    }

    // chưa có lịch chiếu
    await db.execute(`UPDATE rooms SET status = 0 WHERE room_id = ?`, [id]);
    return successResponse([], "Chuyển trạng thái phòng thành công", 200);
  } catch (error) {
    console.log(error);
    return errorResponse("Xóa phòng lỗi", 400);
  }
}

// cập nhật phòng
export async function PUT(req: Request, { params }: { params: string }) {
  try {
    // id phòng
    const { id } = await params;
    const body = await req.json();
    // type = 0: cập nhật tên hoặc chưa có lịch chiếu
    // type = 1: cập nhật có showtime
    // type = 2: cập nhật có showtime hoàn tiền nếu cần
    const { type, name, width, height, capacity, aside_gap } = body;

    if (type === undefined) {
      console.log("Thiếu type");
      return errorResponse("Cập nhật phòng lỗi", 400);
    }

    const connection = await db.getConnection();
    await connection.beginTransaction();

    // hủy lịch chiếu
    if (type === 1) {
    }

    // hoàn tiền
    if (type === 2) {
    }

    // TODO
    // cập nhật room
    await db.execute(
      `UPDATE rooms SET name = ?, capacity = ?, width = ?, height = ? WHERE room_id = ?`,
      [name, capacity, width, height, id]
    );

    const allEmpty = aside_gap.every((item) => item.aside.length === 0);
    // cập nhật gap nếu có
    if (!allEmpty) {
      //lấy gap cũ
      const [asideGap] = await db.query(
        `SELECT * FROM asile_gap WHERE room_id = ?`,
        [id]
      );
      // gap FE
      const normalizeFromFE = (aside_gap) =>
        aside_gap.flatMap((row) =>
          row.aside.map((a) => ({
            gap_row: Number(row.gap_row),
            gap_index: Number(a.gap_index),
            gap_width: Number(a.gap_width),
          }))
        );
      // gap BE
      const normalizeFromDB = (asideGap) =>
        asideGap.map((d) => ({
          gap_id: d.gap_id,
          gap_row: Number(d.gap_row),
          gap_index: Number(d.gap_index),
          gap_width: Number(d.gap_width),
        }));

      const makeKey = (g) => `${g.gap_row}-${g.gap_index}-${g.gap_width}`;

      const feList = normalizeFromFE(aside_gap);
      const dbList = normalizeFromDB(asideGap);

      const feMap = new Map(feList.map((g) => [makeKey(g), g]));
      const dbMap = new Map(dbList.map((g) => [makeKey(g), g]));

      // FE có nhưng DB chưa có → INSERT
      const toInsert = feList.filter((g) => !dbMap.has(makeKey(g)));

      // DB có nhưng FE không còn → DELETE
      const toDelete = dbList.filter((g) => !feMap.has(makeKey(g)));

      if (toDelete.length > 0) {
        const deleteIds = toDelete.map((g) => g.gap_id);

        // TODO
        await db.query(`DELETE FROM asile_gap WHERE gap_id IN (?)`, [
          deleteIds,
        ]);
      }

      if (toInsert.length > 0) {
        const values = toInsert.map((g) => [
          g.gap_row,
          g.gap_index,
          g.gap_width,
          id, // room_id
        ]);

        // TODO
        await db.query(
          `INSERT INTO asile_gap (gap_row, gap_index, gap_width, room_id) VALUES ?`,
          [values]
        );
      }
    }
    // xóa nếu không có
    else {
      await db.query(`DELETE FROM asile_gap WHERE room_id = ?`, [id]);
    }

    const [seats] = await db.query(`SELECT * FROM seats WHERE room_id = ?`, [
      id,
    ]);

    const dbSeats = seats.map((s) => ({
      seat_id: s.seat_id,
      row: s.seat_row, // A, B, C...
      col: Number(s.seat_column), // 1,2,3...
    }));

    const asideMap = new Map();
    /*
  key: rowIndex (1-based)
  value: [{ start, width }]
*/
    aside_gap.forEach((r) => {
      asideMap.set(
        r.gap_row,
        r.aside.map((a) => ({
          start: a.gap_index,
          width: a.gap_width,
        }))
      );
    });

    // Sinh danh sách ghế mới
    const newSeats = generateSeats(width, height, asideMap);

    const seatKey = (s) => `${s.row}-${s.col}`;

    const dbMap = new Map(dbSeats.map((s) => [seatKey(s), s]));
    const newMap = new Map(newSeats.map((s) => [seatKey(s), s]));

    const seatsToInsert = newSeats.filter((s) => !dbMap.has(seatKey(s)));
    const seatsToDelete = dbSeats.filter((s) => !newMap.has(seatKey(s)));

    if (seatsToDelete.length > 0) {
      const ids = seatsToDelete.map((s) => s.seat_id);
      // TODO
      await db.query(`DELETE FROM seats WHERE seat_id IN (?)`, [ids]);
    }

    if (seatsToInsert.length > 0) {
      const values = seatsToInsert.map((s) => [s.row, s.col, id]);

      // TODO
      await db.query(
        `INSERT INTO seats (seat_row, seat_column, room_id) VALUES ? `,
        [values]
      );
    }

    await connection.commit();
    return successResponse([], "Cập nhật phòng thành công", 200);
  } catch (error) {
    console.log(error);
    return errorResponse("Cập nhật phòng lỗi", 400);
  }
}
