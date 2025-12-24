import { db } from "@/lib/db";
import {
  successResponse,
  errorResponse,
  isSameGapStructure,
} from "@/lib/function";

// kiểm tra trước khi ngừng hoạt động phòng
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const start_date = searchParams.get("start_date");
    const end_date = searchParams.get("end_date");

    // KIỂM TRA LỊCH CHIẾU
    const [showtimes]: any = await db.query(
      `SELECT s.showtime_id, s.date 
       FROM showtime s
       WHERE room_id = ? AND status = 1 AND s.date >= ? AND s.date <= ?`,
      [id, start_date, end_date]
    );

    // CASE 1: Không có lịch chiếu
    if (showtimes.length === 0) {
      return successResponse(
        {
          canDeactivate: true,
        },
        "Phòng chưa có lịch chiếu, có thể tạm ngừng hoạt động",
        200
      );
    }

    /* =========================
       2. lấy phòng cần ngừng để kiểm tra
    ========================== */
    const [roomInfo]: any = await db.query(
      `SELECT cinema_id, width, height, capacity 
       FROM rooms 
       WHERE room_id = ? 
       LIMIT 1`,
      [id]
    );

    if (roomInfo.length === 0) {
      return errorResponse("Không tìm thấy phòng", 404);
    }

    const room = roomInfo[0];

    /* =========================
       3. tìm phòng cùng kích thước       
    ========================== */
    const [sameStructureRooms]: any = await db.query(
      `SELECT r.room_id, r.name,
      gap_id, ag.gap_row, ag.gap_index, ag.gap_width 
      FROM rooms r 
      LEFT JOIN asile_gap ag ON r.room_id = ag.room_id 
       WHERE r.cinema_id = ?
         AND r.width = ?
         AND r.height = ?
         AND r.capacity = ?`,
      [room.cinema_id, room.width, room.height, room.capacity]
    );

    // map lại gap theo room
    const mappedRooms = Object.values(
      sameStructureRooms.reduce((acc: any, item: any) => {
        if (!acc[item.room_id]) {
          acc[item.room_id] = {
            room_id: item.room_id,
            name: item.name,
            gaps: [],
          };
        }

        // chỉ push gap khi tồn tại
        if (
          item.gap_row !== null &&
          item.gap_index !== null &&
          item.gap_width !== null
        ) {
          acc[item.room_id].gaps.push({
            row: Number(item.gap_row),
            index: Number(item.gap_index),
            width: Number(item.gap_width),
          });
        }

        return acc;
      }, {})
    );

    if (mappedRooms.length > 1) {
      // check cấu trúc khoảng trống
      const targetRoom = mappedRooms.find((r) => r.room_id == id);

      if (!targetRoom) {
        throw new Error("Không tìm thấy phòng gốc");
      }

      const candidateRooms = mappedRooms.filter(
        (r) => r.room_id !== id && isSameGapStructure(targetRoom.gaps, r.gaps)
      );

      if (candidateRooms.length > 0) {
        return successResponse(
          {
            canDeactivate: false,
            // showtime: showtimes,
            // candidateRooms: candidateRooms,
          },
          `Phòng có ${showtimes.length} lịch chiếu, vui lòng vào "Quản lý suất chiếu" để đổi phòng trước khi ngừng hoạt động phòng hiện tại`,
          200
        );
      }
    }

    /* =========================
       4. CHƯA CÓ PHÒNG THAY THẾ
    ========================== */
    return successResponse(
      {
        canDeactivate: false,
        // showtime: showtimes,
      },
      `Phòng có ${showtimes.length} lịch chiếu nhưng chưa có phòng thay thế, xác nhận ngừng hoạt động phòng và hủy tất cả suất chiếu`,
      200
    );
  } catch (error) {
    console.error(error);
    return errorResponse("Kiểm tra phòng lỗi", 400);
  }
}
