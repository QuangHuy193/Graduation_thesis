import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/function";
export async function GET() {
    try {
        const [rows] = await db.query(`SELECT msc.cinema_id, msc.movie_screen_id, ms.start_time,ms.end_time 
	from movie_screening_cinema msc
	left join movie_screenings ms on ms.movie_screen_id=msc.movie_screen_id`);
        const result: Record<number, any[]> = {};

        for (const r of rows as any[]) {
            if (!result[r.cinema_id]) result[r.cinema_id] = [];

            result[r.cinema_id].push({
                movie_screen_id: r.movie_screen_id,
                start_time: r.start_time,
                end_time: r.end_time
            });
        }

        return successResponse(result, "true", 200);
    } catch (error) {
        return errorResponse("Internal Server Error", 500);
    }
}