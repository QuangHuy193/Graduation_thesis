import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/function";

//Lấy danh sách user admin
export async function GET() {
  try {
    const [admins] = await db.query(
      `SELECT name
      FROM users`
    );

    return successResponse(admins, "success", 201);
  } catch (error) {
    console.error(error);
    return errorResponse("Lấy danh sách user admin thất bại", 500);
  }
}
