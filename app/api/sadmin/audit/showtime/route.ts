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
      `SELECT 
    sa.show_audit_id,
    sa.type_audit,
    sa.created_at,

    sa.user_id,
    u.name AS user_name,

    -- Movie
    m_old.name AS old_movie_name,
    m_new.name AS new_movie_name,

    -- Room
    r_old.name AS old_room_name,
    r_new.name AS new_room_name,

    -- Screening time
    ms_old.start_time AS old_screen_time,
    ms_new.start_time AS new_screen_time

FROM showtime_audit sa
JOIN users u 
    ON sa.user_id = u.user_id

-- OLD DATA
LEFT JOIN movies m_old 
    ON JSON_EXTRACT(sa.old_data, '$.movie_id') = m_old.movie_id

LEFT JOIN rooms r_old 
    ON JSON_EXTRACT(sa.old_data, '$.room_id') = r_old.room_id

LEFT JOIN movie_screenings ms_old
    ON JSON_EXTRACT(sa.old_data, '$.movie_screen_id') = ms_old.movie_screen_id

-- NEW DATA
LEFT JOIN movies m_new 
    ON JSON_EXTRACT(sa.new_data, '$.movie_id') = m_new.movie_id

LEFT JOIN rooms r_new 
    ON JSON_EXTRACT(sa.new_data, '$.room_id') = r_new.room_id

LEFT JOIN movie_screenings ms_new
    ON JSON_EXTRACT(sa.new_data, '$.movie_screen_id') = ms_new.movie_screen_id

ORDER BY sa.show_audit_id DESC
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
