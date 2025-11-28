import { db } from "@/lib/db";
import { errorResponse, successResponse } from "@/lib/function";

export async function GET() {
  try {
    const [rows] = await db.query(
      `SELECT name, image, description FROM promotion_rule WHERE enable = 1 AND display = 1`
    );
    return successResponse(rows, "success", 200);
  } catch (error) {
    console.error(error);
    return errorResponse("Lấy danh sách thất bại", 500);
  }
}
