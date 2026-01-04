import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/function";

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    const { id } = await params;
    try {
        const [rows]: any = await db.query(`SELECT COUNT(*) as TOTAL from seats WHERE room_id=?`, [id]);
        if (rows) {
            return successResponse({ total: rows[0].TOTAL }, "true", 200);
        }
        return errorResponse("Không có phòng chiếu nào", 404);
    }
    catch (error) {
        return errorResponse("Lỗi khi lấy số ghế trống", 500);
    }
}
