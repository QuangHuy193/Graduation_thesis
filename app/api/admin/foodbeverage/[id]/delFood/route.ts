import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/function";
export async function DELETE(
    req: Request,
    { params }: { params: { id: string } }
) {
    const { id } = await params;
    if (!id) {
        return errorResponse("Thiếu id món ăn", 400);
    }
    try {
        await db.query(`DELETE FROM foods WHERE (food_id = ?);`, [id]);
        return successResponse([], "Xóa món ăn thành công", 201);
    } catch (error: any) {
        return errorResponse("Xóa món ăn thất bại", 500);
    }
}