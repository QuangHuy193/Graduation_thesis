import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/function";

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> } // params là Promise trong Next.js
) {
    try {
        const { id } = await params;
        if (!id) return errorResponse("Missing id", 400);

        // Lấy body (JSON)
        const body = await req.json().catch(() => null);
        if (!body || typeof body !== "object")
            return errorResponse("Missing or invalid body", 400);

        // Cho phép update những field này — map sang tên cột DB nếu cần
        const allowed: Record<string, string> = {
            name: "name",
            birthday: "birthday", // expect yyyy-mm-dd
            phone: "phone_number",
            email: "email",
        };

        const sets: string[] = [];
        const values: any[] = [];

        for (const key of Object.keys(allowed)) {
            if (body[key] !== undefined && body[key] !== null) {
                sets.push(`${allowed[key]} = ?`);
                values.push(body[key]);
            }
        }

        if (sets.length === 0) {
            return errorResponse("No updatable fields provided", 400);
        }

        // Thêm id vào cuối values cho WHERE clause
        values.push(id);

        const sql = `UPDATE users SET ${sets.join(", ")} WHERE user_id = ?`;

        const [result] = await db.execute(sql, values);

        // result có thể là ResultSetHeader (mysql2) — lấy affectedRows
        const affectedRows = (result as any)?.affectedRows ?? 0;

        if (affectedRows === 0) {
            return errorResponse("User not found or no changes made", 404);
        }

        // Optionally: trả về số hàng cập nhật hoặc fetch lại user
        // Mình trả affectedRows và fields cập nhật
        return successResponse(
            { updated: true, affectedRows, updatedFields: sets.map(s => s.split(" = ")[0]) },
            "true",
            200
        );
    } catch (error) {
        // Log error nếu cần
        return errorResponse(String(error ?? "Unknown error"), 500);
    }
}
