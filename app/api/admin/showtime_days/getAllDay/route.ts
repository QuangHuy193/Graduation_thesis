import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/function";
export async function GET() {
    try {
        const [row] = await db.execute(`
            SELECT 
    sd.id,
    sd.showtime_id,
    sd.movie_id,
    sd.room_id,
    sd.show_date,
    sd.movie_screen_id,
    m.name AS movie_title,
    r.name AS room_name,
    ms.start_time AS screening_start,
    ms.end_time AS screening_end,
    c.cinema_id,
    c.name AS cinema_name
  FROM showtime_days sd
  LEFT JOIN movies m ON m.movie_id = sd.movie_id
  LEFT JOIN rooms r ON r.room_id = sd.room_id
  LEFT JOIN cinemas c ON c.cinema_id = r.cinema_id
  LEFT JOIN movie_screenings ms ON ms.movie_screen_id = sd.movie_screen_id
  ORDER BY sd.show_date, sd.room_id, sd.movie_screen_id
            `);
        return successResponse(row, "true", 201);
    } catch (error) {
        return errorResponse("false", 400);
    }
}