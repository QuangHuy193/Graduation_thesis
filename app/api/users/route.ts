import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/function";

//Lấy danh sách user
export async function GET() {
    try {
        const [rows] = await db.query("SELECT * FROM users LIMIT 10");
        return successResponse(rows, "success", 201)
    } catch (error) {
        console.error(error);
        return errorResponse("Lấy danh sách thất bại", 500);
    }
}
