import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/function";

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    const { id } = await params;
    try {
        const [rows]: any = await db.query(`SELECT COUNT(*) as AVAILABLE from showtime_seat WHERE status=0 and showtime_id=?`, [id]);
        if (rows) {
            return successResponse({ available: rows[0].AVAILABLE }, "true", 200);
        }
        return errorResponse("Không có suất chiếu nào", 404);
    }
    catch (error) {
        return errorResponse("Lỗi khi lấy số ghế trống", 500);
    }
}
