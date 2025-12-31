import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/function";

//Lấy danh sách rạp, suất chiếu theo ngày và id phim
export async function GET(
  req: Request,
  { params }: { params: { id: number } }
) {
  const { searchParams } = new URL(req.url);
  const day = searchParams.get("day");
  const { id } = await params;
  // lấy thời gian hiện tại
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  if (!day) {
    return errorResponse("Thiếu ngày (day)", 400);
  }

  const dayNum = Number(day);
  if (isNaN(dayNum)) {
    return errorResponse("day phải là số", 400);
  }

  // Tính ngày đích
  const target = new Date();
  target.setDate(target.getDate() + dayNum);

  // Format YYYY-MM-DD
  const date = target.toISOString().split("T")[0];

  try {
    const [rows] = await db.query(
      `SELECT s.showtime_id, s.date, s.movie_id,
              JSON_ARRAYAGG(ms.start_time) AS start_time,
              c.cinema_id, c.name AS cinema_name, c.specific_address, c.ward, c.province,
              r.room_id, r.name AS room_name
       FROM showtime s 
       JOIN movie_screenings ms ON s.movie_screen_id = ms.movie_screen_id
       JOIN rooms r ON s.room_id = r.room_id
       JOIN cinemas c ON c.cinema_id = r.cinema_id
       WHERE s.status = 1
         AND DATE(s.date) = ?
         AND s.movie_id = ?
       GROUP BY s.showtime_id, c.cinema_id, r.room_id
       ORDER BY c.cinema_id, r.room_id`,
      [date, id]
    );
    console.log(date, id);
    console.log("row", rows);

    const cinemasMap = new Map<string | number, any>();

    for (const item of rows as any[]) {
      // lọc lấy các giờ lớn hơn hiện tại
      const cinemaId = item.cinema_id;
      // parse start_time (nếu driver trả về string)
      let startTimes: string[] = [];
      try {
        if (item.start_time == null) {
          startTimes = [];
        } else if (typeof item.start_time === "string") {
          startTimes = JSON.parse(item.start_time);
        } else {
          startTimes = item.start_time;
        } // có thể đã là array
      } catch {
        startTimes = [];
      }

      const today = new Date();
      const isToday = today.toISOString().split("T")[0] === date;

      const futureTimes = startTimes.filter((t) => {
        if (!isToday) return true;
        // "18:00" -> [18, 00]
        const [h, m] = t.split(":").map(Number);
        const minutes = h * 60 + m;
        return minutes > currentMinutes;
      });
      let showtimeObj;
      if (futureTimes.length > 0) {
        showtimeObj = {
          showtime_id: item.showtime_id,
          movie_id: item.movie_id,
          date: item.date,
          start_times: futureTimes, // mảng giờ trong showtime (từ movie_screenings)
          room: {
            room_id: item.room_id,
            room_name: item.room_name,
          },
        };
      }

      if (showtimeObj) {
        if (!cinemasMap.has(cinemaId)) {
          cinemasMap.set(cinemaId, {
            cinema_id: item.cinema_id,
            cinema_name: item.cinema_name,
            specific_address: item.specific_address,
            ward: item.ward,
            province: item.province,
            showtimes: [showtimeObj],
          });
        } else {
          cinemasMap.get(cinemaId).showtimes.push(showtimeObj);
        }
      }
    }

    const data = Array.from(cinemasMap.values());

    return successResponse(data, "success", 200);
  } catch (error) {
    console.error(error);
    return errorResponse("Lấy danh sách thất bại", 500);
  }
}
