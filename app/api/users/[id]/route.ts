import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/function";

export async function GET(
    req: Request,
    { params }: { params: { id: string } }
) {
    const { id } = await params;
    if (!id) return errorResponse("Missing id", 400);
    try {
        const [rows] = await db.execute("select name, birthday, phone_number, email from users where user_id=? ", [id]);
        return successResponse(rows, "true", 200);
    } catch (error) {
        return errorResponse("false", 400);
    }
}