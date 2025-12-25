import { db } from "@/lib/db";
import nodemailer from "nodemailer";
import bcrypt from "bcryptjs";
import { successResponse, errorResponse, generatePass } from "@/lib/function";

const SALT_ROUNDS = 10;

export async function POST(req: Request) {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object")
        return errorResponse("Missing or invalid body", 400);

    const { email } = body as { email?: string };
    if (!email) return errorResponse("Email is required", 400);

    const conn = await db.getConnection();

    try {
        const [rows] = await conn.execute(
            "SELECT user_id, name FROM users WHERE email = ? LIMIT 1",
            [email]
        );

        if (rows.length === 0) {
            return errorResponse("Email không tồn tại", 404);
        }

        const user = rows[0];

        // 🔐 Sinh mật khẩu mới & hash
        const newPass = generatePass();
        const newHash = await bcrypt.hash(newPass, SALT_ROUNDS);

        await conn.beginTransaction();

        // ✅ Update password trực tiếp
        await conn.execute(
            "UPDATE users SET password = ? WHERE user_id = ?",
            [newHash, user.user_id]
        );

        // ✅ Gửi email SAU KHI update OK
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        await transporter.sendMail({
            from: `"CineGO" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: "Yêu cầu đặt lại mật khẩu",
            html: `
        <h3>Xin chào ${user.name}</h3>
        <p>Bạn vừa yêu cầu đặt lại mật khẩu.</p>
        <p>Mật khẩu tạm thời của bạn là:</p>
        <h2>${newPass}</h2>
        <p>Vui lòng đăng nhập và đổi mật khẩu ngay.</p>
      `,
        });

        await conn.commit();

        return successResponse([], "Đã gửi mật khẩu mới qua email", 200);
    } catch (error) {
        await conn.rollback();
        console.error("Forgot password error:", error);
        return errorResponse("Yêu cầu thất bại. Vui lòng thử lại.", 500);
    } finally {
        conn.release();
    }

}
