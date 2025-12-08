import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/function";

//Lấy danh sách vài phim đang chiếu làm baner trượt
export async function GET() {
  try {
    const [foods] = await db.query(
      `SELECT food_id, name, description, image, price as price_final
      FROM foods
      WHERE type = 'food'`
    );
    const [drinks] = await db.query(
      `SELECT food_id, name, description, image, price as price_final
      FROM foods
      WHERE type = 'drink'`
    );
    const [combos] = await db.query(
      `SELECT food_id, name, description, image, price as price_final
      FROM foods
      WHERE type = 'combo'`
    );

    const data = {
      foods,
      drinks,
      combos,
    };

    return successResponse(data, "success", 201);
  } catch (error) {
    console.error(error);
    return errorResponse("Lấy danh sách food drink thất bại", 500);
  }
}
