import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/function";

//Lấy danh sách voucher của user
export async function GET(req: Request, { params }: { params: number }) {
  try {
    // user id
    const { id } = await params;

    const [rows] = await db.query(
      `SELECT v.voucher_id, v.name, v.description, v.rule_uniti, v.value,
      v.voucher_condition
      FROM vouchers v
      JOIN user_voucher uv ON uv.voucher_id = v.voucher_id
      JOIN users u ON u.user_id = uv.user_id
      WHERE uv.user_id = ? AND uv.used_date IS NULL AND 
      ((uv.expired_at IS NOT NULL AND uv.expired_at > NOW())
        OR (uv.expired_at IS NULL AND v.enddate IS NOT NULL AND v.enddate > NOW())
        OR (uv.expired_at IS NULL AND v.enddate IS NULL));`,
      [id]
    );
    return successResponse(rows, "success", 201);
  } catch (error) {
    console.error(error);
    return errorResponse("Lấy danh sách thất bại", 500);
  }
}
