import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/function";
export async function GET(
    req: Request,
    { params }: { params: { id: string } }) {
    try {
        const { id } = await params;
        const [rows] = await db.execute(`SELECT cinema_id from rooms where room_id=?`, [id]);
        return successResponse(
            rows,
            "success fetching cinema of room",
            200
        );
    } catch (error) {
        return errorResponse("false", 400);
    }
}
