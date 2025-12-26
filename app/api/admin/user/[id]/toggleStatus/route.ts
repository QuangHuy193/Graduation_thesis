import { NextResponse } from "next/server";
import { db } from "@/lib/db"; // mysql2/promise pool
import { errorResponse, successResponse } from "@/lib/function";

export async function PATCH(req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = await params;

        // 1. Lấy trạng thái hiện tại
        const [rows]: any = await db.execute(
            "SELECT status FROM users WHERE user_id = ?",
            [id]
        );

        if (rows.length === 0) {
            return errorResponse("Người dùng không tồn tại", 400);
        }

        const currentStatus = rows[0].status;

        // 2. Tính trạng thái mới
        let newStatus: number;
        switch (currentStatus) {
            case 0:
                newStatus = 1;
                break;
            case 1:
                newStatus = 2;
                break;
            case 2:
                newStatus = 1;
                break;
            default:
                newStatus = currentStatus;
        }

        // 3. Update
        await db.execute(
            "UPDATE users SET status = ? WHERE user_id = ?",
            [newStatus, id]
        );

        return successResponse({ status: newStatus }, "Cập nhật trạng thái thành công", 201);
    } catch (error) {
        console.error("Toggle status error:", error);
        return errorResponse("Lỗi server", 500);
    }
}
