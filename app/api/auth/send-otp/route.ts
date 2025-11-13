import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { computeAge } from "@/lib/function";
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

        // Xét xem đây có phải signup flow (client gửi thêm user data) hay không
        const hasUserData = !!(body.name || body.phone_number || body.password || body.birthday || body.role);


        conn = await db.getConnection();
        await conn.beginTransaction();

        // Nếu là signup flow: kiểm tra email đã tồn tại chưa => nếu có thì trả về 409
        if (hasUserData) {
            const [existing] = await conn.execute(
                `SELECT user_id, status FROM users WHERE email = ? LIMIT 1`,
                [email]
            ) as any;

            if (Array.isArray(existing) && existing.length > 0) {
                const existingUser = existing[0];
                const existingUserId = existingUser.user_id;
                const existingStatus = Number(existingUser.status);
                if (existingStatus === 0) {
                    // 🟡 User tồn tại nhưng CHƯA kích hoạt → resend OTP
                    const otpPlain = Math.floor(100000 + Math.random() * 900000).toString();
                    const otpHash = await bcrypt.hash(otpPlain, 10);

                    // Mark OTP cũ consumed
                    await conn.execute(
                        `UPDATE otps SET consumed = 1, consumed_at = NOW() WHERE email = ? AND consumed = 0`,
                        [email]
                    );

                    // Insert OTP mới gán đúng user_id
                    await conn.execute(
                        `INSERT INTO otps (user_id, email, otp, created_at, expires_at, consumed, attempts)
             VALUES (?, ?, ?, NOW(), DATE_ADD(NOW(), INTERVAL 5 MINUTE), 0, 0)`,
                        [existingUserId, email, otpHash]
                    );

                    await conn.commit();

                    // Gửi email OTP lại
                    const transporter = nodemailer.createTransport({
                        service: "gmail",
                        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
                    });

                    await transporter.sendMail({
                        from: `"CineGO" <${process.env.EMAIL_USER}>`,
                        to: email,
                        subject: "Mã OTP xác minh tài khoản CineGo (Gửi lại)",
                        html: `
                <h3>Xin chào,</h3>
                <p>Mã OTP của bạn là:</p>
                <h2 style="color:#4F46E5">${otpPlain}</h2>
                <p>Mã có hiệu lực trong <strong>5 phút</strong>.</p>
            `,
                    });

                    return NextResponse.json({
                        success: true,
                        message: "OTP đã được gửi lại đến email (tài khoản chưa kích hoạt)."
                    });
                }

                if (existingStatus === 1) {
                    // 🔴 User đã kích hoạt → không thể đăng ký lại
                    await conn.rollback();
                    return NextResponse.json(
                        { success: false, message: "Email đã tồn tại" },
                        { status: 409 }
                    );
                }

                // ⚫ Các trạng thái khác (bị khoá, banned, v.v.)
                await conn.rollback();
                return NextResponse.json(
                    { success: false, message: "Email đã được sử dụng" },
                    { status: 409 }
                );
            }

            // Tính age nếu client gửi birthday
            let ageToSave = 0; // mặc định 0 nếu không có birthday
            if (body.birthday) {
                const computed = computeAge(body.birthday);
                if (computed === null) {
                    await conn.rollback();
                    return NextResponse.json({ success: false, message: "Birthday không hợp lệ" }, { status: 400 });
                }
                ageToSave = computed;
            }
            // Tạo user mới với status = 0 (chưa active)
            const insertUserQuery = `
        INSERT INTO users
          (name, phone_number, email, password, birthday,age, role, status, vip, point)
        VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0, 0)
      `;
            const insertUserValues = [
                body.name ?? null,
                body.phone_number ?? null,
                email,
                hashedPassword, // có thể null nếu client không gửi password
                body.birthday ?? null,
                ageToSave,
                body.role ?? "user",
            ];

            const [insertUserRes] = await conn.execute(insertUserQuery, insertUserValues) as any;
            const newUserId = insertUserRes?.insertId;

            if (!newUserId) {
                await conn.rollback();
                return NextResponse.json({ success: false, message: "Không thể tạo user" }, { status: 500 });
            }

            // Sinh OTP và insert otps với user_id liên kết
            const otpPlain = Math.floor(100000 + Math.random() * 900000).toString();
            const otpHash = await bcrypt.hash(otpPlain, 10);

            // Mark mọi OTP chưa tiêu thụ trước đó cho email thành consumed = 1
            await conn.execute(
                `UPDATE otps SET consumed = 1, consumed_at = NOW() WHERE email = ? AND consumed = 0`,
                [email]
            );

            await conn.execute(
                `INSERT INTO otps (user_id, email, otp, created_at, expires_at, consumed, attempts)
         VALUES (?, ?, ?, NOW(), DATE_ADD(NOW(), INTERVAL 5 MINUTE), 0, 0)`,
                [newUserId, email, otpHash]
            );

            await conn.commit();

            // Gửi mail OTP (plaintext)
            const transporter = nodemailer.createTransport({
                service: "gmail",
                auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
            });

            const subject = "Mã OTP xác minh tài khoản CineGo";
            const html = `<h3>Xin chào ${body.name ?? ""},</h3>
        <p>Mã OTP của bạn là:</p>
        <h2 style="color:#4F46E5">${otpPlain}</h2>
        <p>Mã có hiệu lực trong <strong>5 phút</strong>. Hoàn tất xác minh để kích hoạt tài khoản.</p>`;

            await transporter.sendMail({
                from: `"CineGO" <${process.env.EMAIL_USER}>`,
                to: email,
                subject,
                html,
            });

            return NextResponse.json({ success: true, message: "Tài khoản tạm tạo. Mã OTP đã được gửi đến email." });
        } else {
            // Không phải signup flow: chỉ gửi OTP (không tạo user mới)
            // Lưu ý: vẫn chuyển các OTP trước đó thành consumed để tránh duplicate conflicts
            const otpPlain = Math.floor(100000 + Math.random() * 900000).toString();
            const otpHash = await bcrypt.hash(otpPlain, 10);
            const [foundUsers] = await conn.execute(
                `SELECT user_id FROM users WHERE email = ? LIMIT 1`,
                [email]
            ) as any;

            let linkedUserId: number | null = null;
            if (Array.isArray(foundUsers) && foundUsers.length > 0) {
                // Nếu project của bạn dùng user_id là PK thì dùng trực tiếp
                linkedUserId = foundUsers[0]?.user_id ?? null;
                console.log("[send-otp] found existing user for email:", { email, linkedUserId });
            } else {
                console.log("[send-otp] no existing user found for email:", email);
            }

            await conn.execute(
                `UPDATE otps SET consumed = 1, consumed_at = NOW() WHERE email = ? AND consumed = 0`,
                [email]
            );

            await conn.execute(
                `INSERT INTO otps (user_id, email, otp, created_at, expires_at, consumed, attempts)
         VALUES (?, ?, ?, NOW(), DATE_ADD(NOW(), INTERVAL 5 MINUTE), 0, 0)`,
                [linkedUserId, email, otpHash]
            );

            await conn.commit();

            const transporter = nodemailer.createTransport({
                service: "gmail",
                auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
            });

            const subject = "Mã OTP xác minh CineGo";
            const html = `<h3>Xin chào,</h3>
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
        }
    } catch (err) {
        console.error("Send OTP error:", err);
        if (conn) {
            try { await conn.rollback(); } catch (e) { console.error("Rollback failed:", e); }
        }
        return NextResponse.json({ success: false, message: "Không thể gửi OTP. Vui lòng thử lại." }, { status: 500 });
    } finally {
        if (conn) {
            try { conn.release(); } catch (e) { /* ignore */ }
        }
    }
}
