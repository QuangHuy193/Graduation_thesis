import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/function";

// lấy danh sách loại vé kèm giá cho 1 showtime và ngày cụ thể
export async function GET(
  req: Request,
  { params }: { params: { id: number } }
) {
  const { searchParams } = new URL(req.url);
  const { id } = await params;
  const day = Number(searchParams.get("day"));

  if (isNaN(day)) {
    return errorResponse("day phải là số", 400);
  }

  // Tính ngày đích
  const target = new Date();
  target.setDate(target.getDate() + day);

  // Format YYYY-MM-DD
  const date = target.toISOString().split("T")[0];

  try {
    const [rows] = await db.query(
      `SELECT tt.name, pr.price_final
      FROM ticket_type tt
      JOIN price_reality pr ON pr.ticket_type_id = tt.ticket_type_id
      WHERE pr.showtime_id = ? AND pr.date = ?`,
      [id, date]
    );

    return successResponse(rows, "success", 200);
  } catch (error) {
    console.error(error);
    return errorResponse("Lấy danh sách ghế thất bại", 500);
  }
}
