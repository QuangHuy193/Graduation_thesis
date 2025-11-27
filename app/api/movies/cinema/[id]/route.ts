import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/function";
import { MovieFullITF } from "@/lib/interface/movieInterface";

//lấy danh sách phim được chiếu ở rạp (id)
export async function GET(
  req: Request,
  { params }: { params: { id: number } }
) {
  const { id } = await params;
  try {
    const [row] = await db.query(
      `SELECT m.movie_id, m.name
      FROM movies m
      JOIN showtime st ON st.movie_id = m.movie_id
      JOIN rooms r ON r.room_id = st.room_id
      WHERE r.cinema_id = ?
      GROUP BY m.movie_id`,
      [id]
    );

    return successResponse(row, "success", 201);
  } catch (error) {
    console.error(error);
    return errorResponse("Lấy danh sách phim thất bại", 500);
  }
}
