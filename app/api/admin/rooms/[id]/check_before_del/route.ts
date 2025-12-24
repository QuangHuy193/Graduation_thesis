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

    // KIỂM TRA LỊCH CHIẾU
    const [showtimes]: any = await db.query(
      `SELECT s.showtime_id
       FROM showtime s
       WHERE room_id = ? AND status = 1`,
      [id]
    );

    // Không có lịch chiếu
    if (showtimes.length === 0) {
      return successResponse(
        {
          case: "delete",
        },
        "Phòng chưa có lịch chiếu, có thể tạm ngừng hoạt động",
        200
      );
    }

    // lấy phòng cần ngừng để kiểm tra
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

    // tìm phòng cùng kích thước
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

    // check cấu trúc khoảng trống
    const targetRoom = mappedRooms.find((r) => r.room_id == id);

    if (!targetRoom) {
      throw new Error("Không tìm thấy phòng gốc");
    }

    const candidateRooms = mappedRooms.filter(
      (r) => r.room_id !== id && isSameGapStructure(targetRoom.gaps, r.gaps)
    );

    // kiểm tra showtime có booking chưa
    const showtimeIds = showtimes.map((s) => s.showtime_id);

    const [booking]: any = await db.query(
      `SELECT EXISTS(
        SELECT 1 
        FROM booking 
        WHERE showtime_id IN (?)) AS hasBooking`,
      [showtimeIds]
    );

    // có phòng đổi
    if (candidateRooms.length > 0) {
      // có booking
      if (booking[0].hasBooking === 1) {
        return successResponse(
          {
            case: "change_room_booking",
            // showtime: showtimes,
            // candidateRooms: candidateRooms,
          },
          `Phòng có đã ${showtimes.length} lịch chiếu và đã có vé được đặt, vui lòng vào "Quản lý suất chiếu" để đổi phòng trước khi ngừng hoạt động phòng hiện tại hoặc tiếp tục thao tác và hủy tất cả suất chiếu cũng như sẽ hoàn tiền cho khách hàng`,
          200
        );
      }
      // không có booking
      else {
        return successResponse(
          {
            case: "change_room",
            // showtime: showtimes,
            // candidateRooms: candidateRooms,
          },
          `Phòng có đã ${showtimes.length} lịch chiếu, vui lòng vào "Quản lý suất chiếu" để đổi phòng trước khi ngừng hoạt động phòng hiện tại hoặc tiếp tục thao tác và hủy tất cả suất chiếu`,
          200
        );
      }
    }
    // không có phòng thay
    else {
      // có booking
      if (booking[0].hasBooking === 1) {
        return successResponse(
          {
            case: "refund",
            // showtime: showtimes,
          },
          `Phòng đã có ${showtimes.length} lịch chiếu và đã có vé được đặt nhưng chưa có phòng thay thế, xác nhận ngừng hoạt động phòng và hủy tất cả suất chiếu và hoàn tiền cho khách hàng?`,
          200
        );
      }
      // không có booking
      else {
        return successResponse(
          {
            case: "cancel_showtime",
            // showtime: showtimes,
          },
          `Phòng đã có ${showtimes.length} lịch chiếu nhưng chưa có phòng thay thế, xác nhận ngừng hoạt động phòng và hủy tất cả suất chiếu?`,
          200
        );
      }
    }
  } catch (error) {
    console.error(error);
    return errorResponse("Kiểm tra phòng lỗi", 400);
  }
}
