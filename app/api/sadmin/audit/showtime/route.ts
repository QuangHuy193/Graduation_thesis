import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/function";

//Lấy danh sách lịch sử chỉnh sửa showtime
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const limit = Number(url.searchParams.get("limit"));
    const page = Number(url.searchParams.get("page"));
    const offset = (page - 1) * limit;

    const [audits] = await db.query(
      `SELECT sa.show_audit_id, sa.type_audit, sa.old_data, sa.new_data, sa.showtime_id, 
      sa.created_at,
      sa.user_id,  u.name AS user_name,
      m1.name AS old_movie_name, m2.name AS new_movie_name,
      r1.name AS old_room_name, r2.name AS new_room_name,
      ms1.start_time AS old_screen_time, ms2.start_time AS new_screen_time
      FROM showtime_audit sa
      JOIN users u ON sa.user_id = u.user_id
      LEFT JOIN movies m1 ON JSON_EXTRACT(sa.old_data, '$.movie_id') = m1.movie_id
      LEFT JOIN movies m2 ON JSON_EXTRACT(sa.new_data, '$.movie_id') = m2.movie_id
      LEFT JOIN rooms r1 ON JSON_EXTRACT(sa.old_data, '$.room_id') = r1.room_id
      LEFT JOIN rooms r2 ON JSON_EXTRACT(sa.new_data, '$.room_id') = r2.room_id
      LEFT JOIN movie_screenings ms1 
        ON JSON_EXTRACT(sa.old_data, '$.movie_screen_id') = ms1.movie_screen_id
      LEFT JOIN movie_screenings ms2 
        ON JSON_EXTRACT(sa.new_data, '$.movie_screen_id') = ms2.movie_screen_id
      ORDER BY show_audit_id DESC
      LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    const [total] = await db.query(
      `SELECT COUNT(show_audit_id) AS total
      FROM showtime_audit`
    );

    const formatted = audits.map((a: any) => ({
      show_audit_id: a.show_audit_id,
      type_audit: a.type_audit,
      showtime_id: a.showtime_id,
      created_at: a.created_at,
      user: a.user_name,

      old_data: {
        movie: a.old_movie_name,
        room: a.old_room_name,
        screen_time: a.old_screen_time,
      },

      new_data: {
        movie: a.new_movie_name,
        room: a.new_room_name,
        screen_time: a.new_screen_time,
      },
    }));

    return successResponse(
      { audits: formatted, total: total[0].total },
      "success",
      201
    );
  } catch (error) {
    console.error(error);
    return errorResponse("Lấy danh sách audit showtime thất bại", 500);
  }
}
