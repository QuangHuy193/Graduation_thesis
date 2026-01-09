import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/function";
export async function GET() {
    try {
        const [rows]: any = await db.query(`SELECT food_id,name,image,price,type,description from foods`);
        if (rows.length === 0) {
            return errorResponse("Không có món ăn nào trong cơ sở dữ liệu", 404);
        }
        return successResponse(rows, "true", 201);
    } catch (error) {
        return errorResponse("Lỗi máy chủ, không thể lấy món ăn", 500);
    }
}