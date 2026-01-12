import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/function";
export async function POST(req: Request) {
    const body = await req.json();
    const { name, price, type, description } = body;
    if (!name || !price) {
        return errorResponse("Thiếu thông tin món ăn", 400);
    }
    try {
        const newFood: any = await db.query(`INSERT INTO foods (name, price, type, description) VALUES
(?, ?, ?, ?)`, [name, price, type, description]);
        return successResponse([], "Thêm món ăn thành công", 200);
    } catch (error) {
        return errorResponse("Thêm món ăn thất bại", 500);
    }
}