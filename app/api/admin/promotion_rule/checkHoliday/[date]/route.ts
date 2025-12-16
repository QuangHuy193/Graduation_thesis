import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/function";
export async function GET(
    req: Request,
    { params }: { params: { date: string } }
) {
    try {
        const { date } = await params;
        const [rows] = await db.execute(`SELECT rule_id from promotion_rule where ? between start_time and end_time and isHoliday=1 and enable=1 LIMIT 1`, [date]);
        const isHoliday = rows.length > 0;
        return successResponse(
            isHoliday,
            "success fetching cinema of room",
            200
        );
    } catch (error) {
        return errorResponse("false", 400);
    }
}
