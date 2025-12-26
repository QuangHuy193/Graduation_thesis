import { db } from "@/lib/db"; // mysql2/promise pool
import { errorResponse, successResponse } from "@/lib/function";
export async function PATCH(req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = await params;
        if (!id) {
            return errorResponse("Thiếu id", 400);
        }
        // Lấy vai trò hiện tại
        const [rows]: any = await db.execute(
            "SELECT role FROM users WHERE user_id = ?",
            [id]
        );
        if (rows.length === 0) {
            return errorResponse("Người dùng không tồn tại", 400);
        }
        const currentRole = rows[0].role;

        // Xác định vai trò mới
        let newRole: string;
        if (currentRole === "user") {
            newRole = "admin";
        } else if (currentRole === "admin") {
            newRole = "user";
        } else {
            return errorResponse("Không thể thay đổi quyền Super Admin", 403);
        }
        await db.execute(`UPDATE users set role=? where user_id=?`, [newRole, id]);
        return successResponse({ user_id: id, role: newRole }, "Cập nhật thành công", 201);
    } catch (error) {
        return errorResponse("Lỗi server", 500);
    }
}