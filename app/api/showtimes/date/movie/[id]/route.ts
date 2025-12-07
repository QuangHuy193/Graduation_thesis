import { LIMITDAY } from "@/lib/constant";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/function";

// lấy ngày chiếu theo phim và rạp
export async function GET(
  req: Request,
  { params }: { params: { id: number } }
) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const cinema_id = searchParams.get("cinema_id");
  try {
    const [rows] = await db.query(
      `SELECT st.date, st.showtime_id
      FROM showtime st
      JOIN movies m ON st.movie_id = m.movie_id
      JOIN rooms r ON r.room_id = st.room_id
      WHERE m.movie_id = ? AND r.cinema_id = ?`,
      [id, cinema_id]
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const result: Array<{
      showtime_id: number;
      date: Date;
      dateDisplay: string;
      weekday: number;
    }> = [];
    const seen = new Set<string>();

    for (const item of rows as any[]) {
      const clone = new Date(item.date);
      clone.setHours(0, 0, 0, 0);

      if (clone < today) continue;

      if (result.length >= LIMITDAY) break;
      const dd = clone.getDate().toString().padStart(2, "0");
      const mm = (clone.getMonth() + 1).toString().padStart(2, "0");
      const dateStr = `${dd}/${mm}`;

      if (!seen.has(dateStr)) {
        seen.add(dateStr);
        result.push({
          showtime_id: item.showtime_id,
          date: item.date,
          dateDisplay: dateStr,
          weekday: clone.getDay(),
        });
      }
    }

    return successResponse(result, "success", 201);
  } catch (error) {
    console.error(error);
    return errorResponse("Lấy danh sách ngày chiếu thất bại", 500);
  }
}
