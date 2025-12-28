import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/function";
import { getCurrentDateTime } from "@/lib/function";
export async function GET() {
    try {
        const dateNow = getCurrentDateTime().substring(0, 10);
        const [movieRows]: any = await db.execute(
            `SELECT COUNT(DISTINCT m.movie_id) as count
            FROM movies AS m
            left JOIN showtime AS s ON m.movie_id = s.movie_id AND s.date >= ?
            WHERE s.movie_id is null and m.status = 1`,
            [dateNow]
        );
        const moviesWithoutShowtime = movieRows[0]?.count ?? 0;
        return successResponse({
            moviesWithoutShowtime
        }, "Thành công", 200);
    } catch (error) {
        return errorResponse("Lấy cảnh báo thất bại", 500);
    }
}