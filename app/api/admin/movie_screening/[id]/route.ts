import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/function";

export async function PUT(req: Request, { params }: { params: string }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { start_time, end_time } = body;
    await db.execute(
      `UPDATE movie_screenings SET start_time = ?, end_time = ? WHERE movie_screen_id = ?`,
      [start_time, end_time, id]
    );
    return successResponse([], "Cập nhật khung giờ chiếu thành công", 201);
  } catch (error) {
    console.log(error);
    return errorResponse("Cập nhật khung giờ chiếu thất bại", 500);
  }
}

export async function DELETE(req: Request, { params }: { params: string }) {
  try {
    const { id } = await params;

    const [showtimes] = await db.query(
      `SELECT COUNT(st.showtime_id) AS count 
    FROM showtime st JOiN movie_screenings ms ON st.movie_screen_id=ms.movie_screen_id 
    WHERE st.movie_screen_id = ? AND st.status= 1`,
      [id]
    );

    console.log("showtimes", showtimes);

    if (showtimes[0].count > 0) {
      return successResponse(
        {
          delete: false,
        },
        `Đã có lịch chiếu cho khung giờ này. Hãy hủy lịch chiếu trước khi hủy giờ chiếu.`,
        201
      );
    }

    await db.query(
      `DELETE FROM movie_screening_cinema msc WHERE msc.movie_screen_id = ?`,
      [id]
    );

    await db.query(
      `DELETE FROM movie_screenings mc WHERE mc.movie_screen_id = ?`,
      [id]
    );

    return successResponse(
      {
        delete: true,
      },
      `Xóa giờ chiếu thành công.`,
      201
    );
  } catch (error) {
    console.log(error);
    return errorResponse("Cập nhật khung giờ chiếu thất bại", 500);
  }
}
