import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/function";
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
    const { id } = await params;
    const body = await request.json();
    const { user_id } = body;
    if (!id) {
        return errorResponse("ID phim không hợp lệ");
    }
    try {
        await db.query(`UPDATE railway.movies SET status = -1,user_id=? WHERE movie_id = ?;`, [user_id, id]);
        return successResponse("Ẩn phim thành công");
    } catch (error) {
        return errorResponse("Lỗi khi ẩn phim", 500);
    }
}