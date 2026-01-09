import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/function";
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { url, target_id, public_id } = body;
        if (!url || target_id == null || !public_id) {
            return errorResponse("Missing required fields", 400);
        }
        const [rows]: any = await db.query(`UPDATE promotion_rule SET image = ?, public_id = ? WHERE rule_id = ?`, [url, public_id, target_id]);
        return successResponse({ rows }, "true", 200);
    } catch (error) {
        return errorResponse("Internal Server Error", 500);
    }
}