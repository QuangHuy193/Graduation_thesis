import { db } from "@/lib/db";
import {
  errorResponse,
  getCurrentDateTime,
  successResponse,
} from "@/lib/function";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { total_price, showtime_id, showtime_date, name, phone, email } =
      body;

    if (!total_price || !showtime_id || !name || !phone || !email) {
      return errorResponse("Thiếu dữ liệu đầu vào", 400);
    }

    const booking_time = getCurrentDateTime();

    const [data] = await db.query(
      `INSERT INTO booking 
      (total_price, booking_time, status, showtime_id, showtime_date, name, phone, email)
       values (?,?,?,?,?,?,?,?)`,
      [
        total_price,
        booking_time,
        0,
        showtime_id,
        showtime_date,
        name,
        phone,
        email,
      ]
    );

    return successResponse(
      {
        booking_id: data.insertId,
      },
      "Tạo booking thành công",
      201
    );
  } catch (error) {
    console.error(error);
    return errorResponse("Tạo booking thất bại", 500, error.message);
  }
}
// import { NextRequest } from "next/server";
// import { NextResponse } from "next/server";
// import { db } from "@/lib/db";
// import { getCurrentDateTime, errorResponse, successResponse } from "@/lib/function";

// export async function POST(req: NextRequest) {
//   try {
//     const body = await req.json();

//     const {
//       total_price,
//       showtime_id,
//       showtime_date,
//       name,
//       phone,
//       email,
//       user_id
//     } = body;

//     if (!total_price || !showtime_id || !showtime_date) {
//       return errorResponse("Thiếu dữ liệu đầu vào", 400);
//     }

//     if (!/^\d{10}$/.test(phone) && phone) {
//       return errorResponse("Số điện thoại không hợp lệ", 400);
//     }

//     const booking_time = getCurrentDateTime();

//     const [data] = await db.query(
//       `INSERT INTO booking
//         (total_price, booking_time, status, payment_method, refund_all, refund_all_time,
//          user_id, voucher_id, showtime_id, name, phone, email, showtime_date)
//        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
//       [
//         total_price,
//         booking_time,
//         0,
//         null,
//         null,
//         null,
//         user_id, // 🟢 Lưu từ body vào DB
//         null,
//         showtime_id,
//         name,
//         phone,
//         email,
//         showtime_date
//       ]
//     );

//     return successResponse(
//       { booking_id: data.insertId },
//       "Tạo booking thành công",
//       201
//     );
//   } catch (err: any) {
//     console.error("Booking error:", err);
//     return errorResponse("Tạo booking thất bại", 500, err.message);
//   }
// }

