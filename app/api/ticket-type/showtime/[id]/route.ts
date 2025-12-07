import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/function";

// lấy danh sách loại vé kèm giá cho 1 showtime và ngày cụ thể
export async function GET(
  req: Request,
  { params }: { params: { id: number } }
) {
  const { id } = await params;

  try {
    const [rows] = await db.query(
      `SELECT tt.name, pr.price_final
      FROM ticket_type tt
      JOIN price_reality pr ON pr.ticket_type_id = tt.ticket_type_id
      WHERE pr.showtime_id = ?`,
      [id]
    );

    return successResponse(rows, "success", 200);
  } catch (error) {
    console.error(error);
    return errorResponse("Lấy danh sách vé thất bại", 500);
  }
}
