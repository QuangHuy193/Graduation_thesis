import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/function";

// lấy danh sách trống của phòng theo id
export async function GET(
  req: Request,
  { params }: { params: { id: number } }
) {
  const { id } = await params;
  if (Number.isNaN(id)) {
    return errorResponse("Invalid room id", 400);
  }

  try {
    // 1) Lấy thông tin phòng
    const [roomRows] = await db.query(
      `SELECT name, width, height, capacity FROM rooms WHERE room_id = ?`,
      [id]
    );

    const room =
      Array.isArray(roomRows) && roomRows.length > 0 ? roomRows[0] : null;
    if (!room) {
      return errorResponse("Room not found", 404);
    }

    const { name, width, height, capacity } = room;

    // 2) Lấy tất cả gap cho phòng
    const [gapRows] = await db.query(
      `SELECT gap_row, gap_index, gap_width
       FROM asile_gap
       WHERE room_id = ?
       ORDER BY gap_row, gap_index`,
      [id]
    );

    // 3) Gom dữ liệu theo row -> aside[]
    const gapsByRow = new Map<
      number,
      Array<{ gap_index: number; gap_width: number }>
    >();
    if (Array.isArray(gapRows)) {
      for (const r of gapRows) {
        const row = Number(r.gap_row);
        if (!gapsByRow.has(row)) gapsByRow.set(row, []);
        gapsByRow.get(row)?.push({
          gap_index: Number(r.gap_index),
          gap_width: Number(r.gap_width),
        });
      }
    }

    // 4) Xây mảng aside_gap đảm bảo có entry cho mỗi dòng từ 1..height
    const aside_gap = [];
    for (let row = 1; row <= Number(height); row++) {
      aside_gap.push({
        gap_row: row,
        aside: gapsByRow.get(row) ?? [],
      });
    }

    const data = {
      name,
      width: Number(width),
      height: Number(height),
      capacity: Number(capacity),
      aside_gap,
    };

    return successResponse(data, "success", 200);
  } catch (error) {
    console.error(error);
    return errorResponse("Lấy thông tin khoảng trống phòng thất bại", 500);
  }
}
