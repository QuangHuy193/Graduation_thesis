import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/function";
export async function POST(
    req: Request,
    { params }: { params: { id: string } }
) {
    const { id } = await params;
    const body = await req.json();
    const { name, price, type, description } = body;
    try {
        await db.query(`UPDATE foods SET name = ?, price = ?, type = ?, description = ? WHERE food_id = ?`, [name, price, type, description, id]);
        return successResponse("Cập nhật món ăn thành công");
    } catch (error) {
        return errorResponse("Lỗi khi cập nhật món ăn");
    }
}