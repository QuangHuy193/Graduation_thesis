// app/api/promotion-rule/route.ts
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/function";
export async function POST(req: Request) {
    const body = await req.json().catch(() => null);

    if (!body) {
        return errorResponse("Dữ liệu không hợp lệ", 400);
    }

    const {
        name,
        start_time = null,
        end_time = null,
        priority = 1,
        description = null,
        isHoliday = null,
    } = body;

    // ===== VALIDATION =====
    if (!name || typeof name !== "string") {
        return errorResponse("Thiếu tên !", 400);
    }

    if (priority < 1 || priority > 5) {
        return errorResponse("Độ ưu tiên không hợp lệ !", 400);
    }

    if (start_time && end_time) {
        const s = new Date(start_time);
        const e = new Date(end_time);
        if (s > e) {
            return errorResponse("Thời gian không hợp lệ", 400);
        }
    }

    const conn = await db.getConnection();
    try {
        const [result]: any = await conn.query(
            `
      INSERT INTO promotion_rule
        (name, start_time, end_time, priority, enable, display, description, isHoliday)
      VALUES (?, ?, ?, ?, 0, 0, ?, ?)
      `,
            [
                name,
                start_time,
                end_time,
                priority,
                description,
                isHoliday,
            ]
        );

        return successResponse({ rule_id: result.insertId }, "true", 201);
    } catch (err) {
        console.error("create promotion_rule error:", err);
        return errorResponse("Lỗi máy chủ", 500);
    } finally {
        conn.release();
    }
}
