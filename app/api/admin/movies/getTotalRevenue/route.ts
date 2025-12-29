import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/function";
type Params = {
    params: {
        id: string;
    };
};
export async function GET(
    req: Request
) {

    try {
        const [rows] = await db.execute(`SELECT  m.movie_id,sum(total_price) as TONG  from booking b left join showtime s on b.showtime_id=s.showtime_id
								  left join movies m on s.movie_id= m.movie_id
								  where b.status=1 GROUP by m.movie_id`);
        return successResponse(rows, "Thành công", 201);
    } catch (error) {
        return errorResponse("That bai", 500);
    }
}