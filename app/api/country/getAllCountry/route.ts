import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/function";
export async function GET() {
    try {
        // Nếu db là mysql2/promise: db.query trả về [rows, fields]
        const [rows] = await db.query(
            `SELECT country_id AS country_id, name, code, language
       FROM country
       ORDER BY name ASC`
        );

        // trả về định dạng chuẩn bằng helper successResponse
        return successResponse(rows, "true", 201);
    } catch (err) {
        console.error("GET /api/countries error:", err);
        return errorResponse("Lỗi khi lấy danh sách country", 400);
    }
}