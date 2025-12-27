import { db } from "@/lib/db";
import { errorResponse, successResponse } from "@/lib/function";

export async function PATCH(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = await params;
        const ruleId = Number(id);

        if (!ruleId || Number.isNaN(ruleId)) {
            return errorResponse("ID không hợp lệ", 400);
        }

        const body = await req.json();

        const {
            name,
            image,
            start_time,
            end_time,
            priority,
            enable,
            display,
            description,
            isHoliday,
        } = body;

        // 🔎 Kiểm tra tồn tại
        const [rows]: any = await db.execute(
            "SELECT rule_id FROM promotion_rule WHERE rule_id = ?",
            [ruleId]
        );

        if (rows.length === 0) {
            return errorResponse("Promotion không tồn tại", 404);
        }

        // 🧠 Build dynamic update
        const fields: string[] = [];
        const values: any[] = [];

        if (name !== undefined) {
            fields.push("name = ?");
            values.push(name);
        }
        if (image !== undefined) {
            fields.push("image = ?");
            values.push(image);
        }
        if (start_time !== undefined) {
            fields.push("start_time = ?");
            values.push(start_time);
        }
        if (end_time !== undefined) {
            fields.push("end_time = ?");
            values.push(end_time);
        }
        if (priority !== undefined) {
            fields.push("priority = ?");
            values.push(priority);
        }
        if (enable !== undefined) {
            fields.push("enable = ?");
            values.push(enable);
        }
        if (display !== undefined) {
            fields.push("display = ?");
            values.push(display);
        }
        if (description !== undefined) {
            fields.push("description = ?");
            values.push(description);
        }
        if (isHoliday !== undefined) {
            fields.push("isHoliday = ?");
            values.push(isHoliday);
        }

        if (fields.length === 0) {
            return errorResponse("Không có dữ liệu cập nhật", 400);
        }

        // 🚀 Update
        await db.execute(
            `UPDATE promotion_rule SET ${fields.join(", ")} WHERE rule_id = ?`,
            [...values, ruleId]
        );

        // 📤 Lấy lại data mới
        const [updated]: any = await db.execute(
            "SELECT * FROM promotion_rule WHERE rule_id = ?",
            [ruleId]
        );

        return successResponse(
            updated[0],
            "Cập nhật promotion thành công",
            200
        );
    } catch (error) {
        console.error(error);
        return errorResponse("Lỗi server", 500);
    }
}
