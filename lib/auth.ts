// lib/auth.ts
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

export async function verifyCredentials(identifier: string, password: string) {
    try {
        if (!identifier || !password) return null;

        // chuẩn hoá phone nếu bạn muốn (ví dụ remove spaces)
        const cleaned = identifier.trim();

        // Tìm user bằng email hoặc phone_number
        const [rows]: any = await db.execute(
            `SELECT user_id, name, email, phone_number, role, password AS hashedPassword, status
       FROM users
       WHERE email = ? OR phone_number = ?
       LIMIT 1`,
            [cleaned, cleaned]
        );

        const user = rows?.[0];
        if (!user) return null;

        // Kiểm tra trạng thái (giả sử status: 1 active, 0 inactive)
        if (typeof user.status !== "undefined") {
            if (Number(user.status) === 0) return null;
        }

        // So sánh mật khẩu
        const hashed = user.hashedPassword ?? user.password ?? null;
        if (!hashed) return null;

        const isMatch = await bcrypt.compare(password, hashed);
        if (!isMatch) return null;

        // Trả về object user (không trả password)
        return {
            user_id: user.user_id,
            name: user.name,
            email: user.email,
            role: user.role,
        };
    } catch (err) {
        console.error("verifyCredentials error:", err);
        return null;
    }
}
