import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/function";
export async function GET() {
    try {
        const [row] = await db.execute(`SELECT cinema_id, name from cinemas`);
        return successResponse(row, "true", 201);
    } catch (error) {
        return errorResponse("false", 400);
    }
}
