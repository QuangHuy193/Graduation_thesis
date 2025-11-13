import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

const MAX_ATTEMPTS = 5;

export async function POST(req: Request) {
    let conn;
    try {
        const { email, otp } = await req.json();
        if (!email || !otp) {
            return NextResponse.json({ success: false, message: "Thiếu email hoặc otp" }, { status: 400 });
        }

        conn = await db.getConnection();
        await conn.beginTransaction();

        // LẤY OTP CHƯA CONSUMED VÀ CHƯA HẾT HẠN (SO SÁNH Ở DB) VÀ KHÓA HÀNG
        const [rows] = await conn.execute(
            `SELECT id, otp, attempts, expires_at, consumed, consumed_at, created_at, user_data, UTC_TIMESTAMP() as mysql_now
       FROM otps
       WHERE email = ? AND consumed = 0 AND expires_at > UTC_TIMESTAMP()
       ORDER BY created_at DESC
       LIMIT 1
       FOR UPDATE`,
            [email]
        ) as any;

        if (!rows || rows.length === 0) {
            await conn.commit();
            return NextResponse.json({ success: false, message: "Không tìm thấy OTP hợp lệ hoặc OTP đã hết hạn" }, { status: 400 });
        }

        const record = rows[0];

        // debug
        console.log("[verify-otp] record:", {
            id: record.id,
            created_at: record.created_at,
            expires_at: record.expires_at,
            mysql_now: record.mysql_now,
            consumed: record.consumed,
            consumed_at: record.consumed_at,
            attempts: record.attempts,
            email
        });

        // So sánh OTP
        const match = await bcrypt.compare(otp, record.otp);

        if (!match) {
            // Sai OTP: tăng attempts
            const [incRes] = await conn.execute(
                `UPDATE otps SET attempts = attempts + 1 WHERE id = ?`,
                [record.id]
            ) as any;

            const [updatedRows] = await conn.execute(
                `SELECT attempts FROM otps WHERE id = ? FOR UPDATE`,
                [record.id]
            ) as any;

            const attemptsAfter = updatedRows[0]?.attempts ?? (record.attempts + 1);

            if (attemptsAfter >= MAX_ATTEMPTS) {
                const [res] = await conn.execute(
                    `UPDATE otps SET consumed = 1, consumed_at = NOW() WHERE id = ? AND consumed = 0`,
                    [record.id]
                ) as any;
                console.log("[verify-otp] max-attempts-update affectedRows:", res.affectedRows);
            }

            await conn.commit();
            return NextResponse.json({ success: false, message: "OTP không đúng", attempts: attemptsAfter }, { status: 400 });
        }

        // Nếu đúng: mark consumed atomically
        const [markRes] = await conn.execute(
            `UPDATE otps SET consumed = 1, consumed_at = NOW() WHERE id = ? AND consumed = 0`,
            [record.id]
        ) as any;
        console.log("[verify-otp] success-update affectedRows:", markRes.affectedRows);

        if (markRes.affectedRows === 0) {
            // Đã bị tiêu thụ bởi request khác
            await conn.commit();
            return NextResponse.json({ success: false, message: "OTP đã bị sử dụng/tiêu thụ bởi yêu cầu khác" }, { status: 409 });
        }

        // commit rồi trả về otp id để client hoặc endpoint signup dùng
        await conn.commit();
        return NextResponse.json({
            success: true,
            message: "Xác thực OTP thành công.",
            otpId: record.id
        });
    } catch (err) {
        console.error("Verify OTP error:", err);
        if (conn) {
            try { await conn.rollback(); } catch (e) { console.error("Rollback failed:", e); }
        }
        return NextResponse.json({ success: false, message: "Không thể xác thực OTP. Vui lòng thử lại." }, { status: 500 });
    } finally {
        if (conn) conn?.release?.();
    }
}
