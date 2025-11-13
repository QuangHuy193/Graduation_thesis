import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

type ReqBody = {
    email: string;
    name?: string;
    phone_number?: string;
    password?: string;
    birthday?: string;
    role?: "superadmin" | "admin" | "user";
};

function validateEmail(email: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(req: Request) {
    let conn;
    try {
        const body = (await req.json()) as ReqBody;
        const { email } = body;

        if (!email || !validateEmail(email)) {
            return NextResponse.json({ success: false, message: "Email không hợp lệ" }, { status: 400 });
        }

        // Nếu client gửi password trong user_data -> hash trước khi lưu
        let hashedPassword: string | null = null;
        if (body.password) {
            hashedPassword = await bcrypt.hash(body.password, 10);
        }

        // Chuẩn bị user_data nếu client gửi (signup flow)
        const hasUserData = !!(body.name || body.phone_number || body.password || body.birthday || body.role);
        const tempUser = hasUserData
            ? {
                name: body.name ?? null,
                phone_number: body.phone_number ?? null,
                email,
                password: hashedPassword, // lưu hash, không lưu password thô
                birthday: body.birthday ?? null,
                role: body.role ?? "user",
            }
            : null;

        // Sinh mã OTP 6 chữ số (plaintext để gửi mail)
        const otpPlain = Math.floor(100000 + Math.random() * 900000).toString();
        const otpHash = await bcrypt.hash(otpPlain, 10);

        conn = await db.getConnection();
        await conn.beginTransaction();

        // Nếu là signup flow (user_data có), kiểm tra email đã tồn tại trong users chưa
        if (hasUserData) {
            const [existing] = await conn.execute(
                `SELECT user_id FROM users WHERE email = ? LIMIT 1`,
                [email]
            ) as any;
            if (Array.isArray(existing) && existing.length > 0) {
                await conn.commit();
                return NextResponse.json({ success: false, message: "Email đã được sử dụng" }, { status: 409 });
            }
        }



        // Insert OTP mới. Nếu có user_data -> lưu JSON, nếu không -> bỏ cột user_data
        let reusedUserData: any = null;
        if (!tempUser) {
            try {
                // Lấy record otps chưa consumed mới nhất có user_data và chưa hết hạn
                const [prevRows] = await conn.execute(
                    `SELECT id, user_data, expires_at FROM otps
       WHERE email = ? AND consumed = 0 AND user_data IS NOT NULL AND expires_at > UTC_TIMESTAMP()
       ORDER BY created_at DESC
       LIMIT 1`,
                    [email]
                ) as any;

                if (Array.isArray(prevRows) && prevRows.length > 0) {
                    const prev = prevRows[0];
                    // Nếu user_data là string hoặc object, xử lý tương tự như verify/signup
                    if (prev.user_data) {
                        if (typeof prev.user_data === "string") {
                            try {
                                reusedUserData = JSON.parse(prev.user_data);
                            } catch {
                                // nếu parse lỗi, fallback: bỏ không reuse
                                reusedUserData = null;
                            }
                        } else if (typeof prev.user_data === "object") {
                            reusedUserData = prev.user_data;
                        }
                    }
                }
            } catch (e) {
                console.warn("[send-otp] failed to fetch previous user_data:", e);
                // không block flow vì vẫn có thể gửi OTP không kèm user_data
                reusedUserData = null;
            }
        }
        // Mark mọi OTP chưa tiêu thụ trước đó thành consumed = 1 để tránh unique constraint
        await conn.execute(
            `UPDATE otps SET consumed = 1, consumed_at = NOW() WHERE email = ? AND consumed = 0`,
            [email]
        );
        // Decide finalUserData: ưu tiên tempUser (từ body), nếu không có thì reusedUserData
        const finalUserData = tempUser ?? reusedUserData ?? null;

        // Insert OTP mới. Nếu có user_data -> lưu JSON, nếu không -> bỏ cột user_data
        let insertRes;
        if (finalUserData) {
            insertRes = await conn.execute(
                `INSERT INTO otps (user_id, email, otp, user_data, created_at, expires_at, consumed, attempts)
     VALUES (NULL, ?, ?, ?, NOW(), DATE_ADD(NOW(), INTERVAL 5 MINUTE), 0, 0)`,
                [email, otpHash, JSON.stringify(finalUserData)]
            );
        } else {
            insertRes = await conn.execute(
                `INSERT INTO otps (user_id, email, otp, created_at, expires_at, consumed, attempts)
     VALUES (NULL, ?, ?, NOW(), DATE_ADD(NOW(), INTERVAL 5 MINUTE), 0, 0)`,
                [email, otpHash]
            );
        }

        await conn.commit();

        // Gửi email (gửi plaintext otpPlain)
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
        });

        const subject = tempUser ? "Mã OTP xác minh tài khoản CineGo" : "Mã OTP xác minh CineGo";
        const html = tempUser
            ? `<h3>Xin chào ${tempUser.name ?? ""},</h3>
         <p>Mã OTP của bạn là:</p>
         <h2 style="color:#4F46E5">${otpPlain}</h2>
         <p>Mã có hiệu lực trong <strong>5 phút</strong>. Hoàn tất xác minh để hoàn tất đăng ký tài khoản.</p>`
            : `<h3>Xin chào,</h3>
         <p>Mã OTP của bạn là:</p>
         <h2 style="color:#4F46E5">${otpPlain}</h2>
         <p>Mã có hiệu lực trong <strong>5 phút</strong>.</p>`;

        await transporter.sendMail({
            from: `"CineGO" <${process.env.EMAIL_USER}>`,
            to: email,
            subject,
            html,
        });

        return NextResponse.json({ success: true, message: "Mã OTP đã được gửi đến email của bạn." });
    } catch (err) {
        console.error("Send OTP error:", err);
        if (conn) {
            try { await conn.rollback(); } catch (e) { console.error("Rollback failed:", e); }
        }
        return NextResponse.json({ success: false, message: "Không thể gửi OTP. Vui lòng thử lại." }, { status: 500 });
    } finally {
        if (conn) conn?.release?.();
    }
}
