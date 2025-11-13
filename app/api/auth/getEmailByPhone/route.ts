import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: Request) {
    try {
        const { phone_number } = await req.json();

        if (!phone_number) {
            return NextResponse.json(
                { success: false, message: "Thiếu số điện thoại" },
                { status: 400 }
            );
        }

        const [rows] = await db.query(
            "SELECT email FROM users WHERE phone_number = ? LIMIT 1",
            [phone_number]
        ) as any;

        if (!Array.isArray(rows) || rows.length === 0) {
            return NextResponse.json(
                { success: false, message: "Không tìm thấy email theo số điện thoại" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: { email: rows[0].email },
        });

    } catch (err) {
        console.error("get-email-by-phone error:", err);
        return NextResponse.json(
            { success: false, message: "Lỗi server" },
            { status: 500 }
        );
    }
}
