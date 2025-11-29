import { db } from "@/lib/db";
import { errorResponse, successResponse } from "@/lib/function";
export async function GET(
    req: Request,
    { params }: { params: { id: string } }
) {
    const { id } = await params;

    try {
        const [row] = await db.execute(`select	b.booking_id, m.name as movie, c.name as cinema, b.booking_time, b.total_price
	from users u 
	JOIN booking b on b.user_id=u.user_id 
	JOIN showtime s on s.showtime_id=b.showtime_id
	join movies m on m.movie_id=s.movie_id
	join rooms r on r.room_id=s.room_id
	join cinemas c on c.cinema_id=r.cinema_id
	where u.user_id=?`, [id]);
        return successResponse(row, "true", 201);
    } catch (error) {
        return errorResponse("false", 400);
    }
}