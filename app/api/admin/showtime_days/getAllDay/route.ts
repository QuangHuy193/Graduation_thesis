import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/function";
export async function GET() {
    try {
        const [row] = await db.execute(`
            SELECT 
    sd.showtime_id,
    sd.movie_id,
    sd.room_id,
    sd.date,
    sd.movie_screen_id,

    m.name AS movie_title,
    r.name AS room_name,
    c.cinema_id,
    c.name AS cinema_name,

    ms.start_time AS screening_start,
    ms.end_time AS screening_end,

    COUNT(DISTINCT s.seat_id) AS total_seats,
    SUM(CASE WHEN ss.status = 0 THEN 1 ELSE 0 END) AS available_seats,
    SUM(CASE WHEN ss.status = 1 THEN 1 ELSE 0 END) AS booked_seats

FROM showtime sd
LEFT JOIN movies m ON m.movie_id = sd.movie_id
LEFT JOIN rooms r ON r.room_id = sd.room_id
LEFT JOIN cinemas c ON c.cinema_id = r.cinema_id
LEFT JOIN movie_screenings ms ON ms.movie_screen_id = sd.movie_screen_id

LEFT JOIN seats s ON s.room_id = sd.room_id
LEFT JOIN showtime_seat ss 
       ON ss.showtime_id = sd.showtime_id 
      AND ss.seat_id = s.seat_id
WHERE sd.status=1
GROUP BY
    sd.showtime_id,
    sd.movie_id,
    sd.room_id,
    sd.date,
    sd.movie_screen_id,
    m.name,
    r.name,
    c.cinema_id,
    c.name,
    ms.start_time,
    ms.end_time

ORDER BY sd.date, sd.room_id, sd.movie_screen_id
            `);
        return successResponse(row, "true", 201);
    } catch (error) {
        return errorResponse("false", 400);
    }
}