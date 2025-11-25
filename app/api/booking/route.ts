// import { db } from "@/lib/db";
// import {
//   errorResponse,
//   getCurrentDateTime,
//   successResponse,
// } from "@/lib/function";

// export async function POST(req: Request) {
//   try {
//     const body = await req.json();
//     const { total_price, showtime_id, showtime_date, name, phone, email } =
//       body;

//     if (!total_price || !showtime_id || !name || !phone || !email) {
//       return errorResponse("Thiếu dữ liệu đầu vào", 400);
//     }

//     const booking_time = getCurrentDateTime();

//     const [data] = await db.query(
//       `INSERT INTO booking 
//       (total_price, booking_time, status, showtime_id, showtime_date, name, phone, email)
//        values (?,?,?,?,?,?,?,?)`,
//       [
//         total_price,
//         booking_time,
//         0,
//         showtime_id,
//         showtime_date,
//         name,
//         phone,
//         email,
//       ]
//     );

//     return successResponse(
//       {
//         booking_id: data.insertId,
//       },
//       "Tạo booking thành công",
//       201
//     );
//   } catch (error) {
//     console.error(error);
//     return errorResponse("Tạo booking thất bại", 500, error.message);
//   }
// }
import { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getToken } from "next-auth/jwt";
import { getCurrentDateTime, errorResponse, successResponse } from "@/lib/function";

const SECRET = process.env.NEXTAUTH_SECRET!;

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: SECRET });
    const body = await req.json();

    const { total_price, showtime_id, showtime_date, name, phone, email } = body;

    if (!total_price || !showtime_id || !name || !phone || !email) {
      return errorResponse("Thiếu dữ liệu đầu vào", 400);
    }

    if (!/^\d{10}$/.test(phone)) {
      return errorResponse("Số điện thoại không hợp lệ", 400);
    }

    const booking_time = getCurrentDateTime();

    const user_id = token?.user_id ?? null;

    const [data] = await db.query(
      `INSERT INTO booking 
        (total_price, booking_time, status, payment_method, refund_all, refund_all_time,
         user_id, voucher_id, showtime_id, name, phone, email, showtime_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        total_price,
        booking_time,
        0,                // status = 0 (chưa thanh toán)
        null,             // payment_method
        null,             // refund_all
        null,             // refund_all_time
        user_id,          // nếu có user → lưu
        null,             // voucher_id
        showtime_id,
        name,
        phone,
        email,
        showtime_date
      ]
    );

    return successResponse(
      { booking_id: data.insertId },
      "Tạo booking thành công",
      201
    );
  } catch (err: any) {
    console.error("Booking error:", err);
    return errorResponse("Tạo booking thất bại", 500, err.message);
  }
}
