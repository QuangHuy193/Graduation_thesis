import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/function";
import { getCurrentDateTime } from "@/lib/function";

export async function GET() {
    try {
        const dateNow = getCurrentDateTime().substring(0, 10);

        // 1️⃣ Suất chiếu hôm nay
        const [showtimeRows]: any = await db.execute(
            "SELECT COUNT(*) AS count FROM showtime WHERE date = ?",
            [dateNow]
        );
        const showtimesToday = showtimeRows[0]?.count ?? 0;

        // 2️⃣ Phim đang chiếu
        const [movieRows]: any = await db.execute(
            "SELECT COUNT(*) AS count FROM movies WHERE status = 1"
        );
        const moviesNowShowing = movieRows[0]?.count ?? 0;

        // 3️⃣ Khuyến mãi đang hoạt động
        const [promotionRows]: any = await db.execute(
            "SELECT COUNT(*) AS count FROM promotion_rule WHERE enable = 1 AND isHoliday = 0"
        );
        const activePromotions = promotionRows[0]?.count ?? 0;

        return successResponse(
            {
                showtimesToday,
                moviesNowShowing,
                activePromotions,
            },
            "Lấy thống kê hôm nay thành công",
            200
        );
    } catch (error) {
        console.error(error);
        return errorResponse("Lấy thống kê hôm nay thất bại", 500);
    }
}
