import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/function";

// thống kê theo tháng/năm
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const month = url.searchParams.get("month");
    const year = url.searchParams.get("year");

    // số ngày trong tháng
    const daysInMonth = new Date(year, month, 0).getDate();

    if (!month) return errorResponse("Thiếu tháng cần lọc", 400);
    if (!year) return errorResponse("Thiếu năm cần lọc", 400);

    const [paymentRows] = await db.query(
      `SELECT amount, payment_time 
      FROM payment 
      WHERE YEAR(payment_time) = ? AND MONTH(payment_time) = ?`,
      [year, month]
    );

    const [refundRows] = await db.query(
      `SELECT amount, time 
      FROM refund 
      WHERE YEAR(time) = ? AND MONTH(time) = ?`,
      [year, month]
    );

    // Tạo mảng số ngày ban đầu = 0
    const revenueByDay = Array(daysInMonth).fill(0);

    // cộng payment theo ngày
    paymentRows.forEach((row: any) => {
      const day = new Date(row.payment_time).getDate(); // 1-31
      revenueByDay[day - 1] += Number(row.amount);
    });

    // trừ refund theo ngày
    refundRows.forEach((row: any) => {
      const day = new Date(row.time).getDate(); // 1-31
      revenueByDay[day - 1] -= Number(row.amount);
    });
    return successResponse(revenueByDay, "success", 200);
  } catch (error) {
    console.error(error);
    return errorResponse("Lấy thông tin doanh thu thất bại", 500);
  }
}
