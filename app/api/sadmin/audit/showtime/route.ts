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
      `SELECT show_audit_id, type_audit, old_data, new_data, user_id, showtime_id
      FROM showtime_audit
      ORDER BY show_audit_id DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    return successResponse(audits, "success", 201);
  } catch (error) {
    console.error(error);
    return errorResponse("Lấy danh sách audit showtime thất bại", 500);
  }
}
