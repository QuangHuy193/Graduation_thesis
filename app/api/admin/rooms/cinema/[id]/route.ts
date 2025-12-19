import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/function";
export async function GET(req: Request, { params }: { params: string }) {
  try {
    const { id } = await params;
    const [row] = await db.execute(
      `SELECT room_id, name, capacity, width, height, status 
      FROM rooms 
      WHERE cinema_id = ?`,
      [id]
    );
    return successResponse(row, "true", 201);
  } catch (error) {
    return errorResponse("false", 400);
  }
}
