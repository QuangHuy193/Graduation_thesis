import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/function";

export async function GET(
  req: Request,
  { params }: { params: { id: number } }
) {
  try {
    // id rạp
    const { id } = await params;

    const [rows] = await db.query(
      `SELECT price_fixed_id, day_of_week, time_from, time_to, is_holiday,
      price, ticket_type_id
      FROM price_fixed
      WHERE cinema_id = ? AND is_blockbuster = 0`,
      [id]
    );

    // Gom theo day_of_week
    const grouped = Object.values(
      rows.reduce((acc: any, item: any) => {
        if (!acc[item.day_of_week]) {
          acc[item.day_of_week] = {
            day_of_week: item.day_of_week,
            prices: [],
          };
        }

        acc[item.day_of_week].prices.push({
          price_fixed_id: item.price_fixed_id,
          time_from: item.time_from,
          time_to: item.time_to,
          is_holiday: item.is_holiday,
          price: item.price,
          ticket_type_id: item.ticket_type_id,
        });

        return acc;
      }, {})
    );

    return successResponse(grouped, "success", 200);
  } catch (error) {
    console.error("error: ", error);
    return errorResponse("Lấy bảng giá thất bại thất bại", 500);
  }
}
