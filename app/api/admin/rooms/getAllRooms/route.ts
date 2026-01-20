import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/function";
export async function GET() {
    try {
        const [row] = await db.execute(`SELECT 
    r.room_id,
    r.name,
    r.cinema_id,
    COUNT(s.seat_id) AS total_seats
FROM rooms r
LEFT JOIN seats s 
    ON s.room_id = r.room_id
GROUP BY 
    r.room_id, r.name, r.cinema_id;
`);
        return successResponse(row, "true", 201);
    } catch (error) {
        return errorResponse("false", 400);
    }
}