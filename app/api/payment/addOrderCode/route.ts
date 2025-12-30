import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { booking_id, order_code } = body as {
            booking_id?: number;
            order_code?: string | number;
        };

        if (!booking_id || !order_code) {
            return NextResponse.json(
                { ok: false, message: "booking_id và order_code là bắt buộc" },
                { status: 400 }
            );
        }

        // cập nhật order_code vào payment
        const [result]: any = await db.execute(
            `UPDATE payment
       SET order_code = ?
       WHERE booking_id = ?`,
            [String(order_code), booking_id]
        );

        if (result.affectedRows === 0) {
            return NextResponse.json(
                { ok: false, message: "Không tìm thấy payment tương ứng" },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { ok: true, message: "Cập nhật order_code thành công" },
            { status: 200 }
        );
    } catch (error: any) {
        console.error("update-order-code error:", error);
        return NextResponse.json(
            { ok: false, message: "Lỗi server", error: error.message },
            { status: 500 }
        );
    }
}
