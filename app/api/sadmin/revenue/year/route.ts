import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/function";

// lấy danh sách trống của phòng theo id
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const year = url.searchParams.get("year");

    if (!year) return errorResponse("Thiếu năm cần lọc", 400);

    const [paymentRows] = await db.query(
      `SELECT amount, payment_time FROM payment WHERE YEAR(payment_time) = ?`,
      [year]
    );

    const [refundRows] = await db.query(
      `SELECT amount, time FROM refund WHERE YEAR(time) = ?`,
      [year]
    );

    // Tạo mảng 12 tháng ban đầu = 0
    const revenue = Array(12).fill(0);

    // Cộng payment theo tháng
    paymentRows.forEach((row: any) => {
      const month = new Date(row.payment_time).getMonth(); // 0-11
      revenue[month] += Number(row.amount);
    });

    // Trừ refund theo tháng
    refundRows.forEach((row: any) => {
      const month = new Date(row.time).getMonth(); // 0-11
      revenue[month] -= Number(row.amount);
    });

    return successResponse(revenue, "success", 200);
  } catch (error) {
    console.error(error);
    return errorResponse("Lấy thông tin doanh thu thất bại", 500);
  }
}
