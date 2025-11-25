// lib/auth.ts
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";
const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET!;
export async function verifyCredentials(identifier: string, password: string) {
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

    // So sánh mật khẩu
    const hashed = user.hashedPassword ?? user.password ?? null;
    if (!hashed) return null;

    const isMatch = await bcrypt.compare(password, hashed);
    if (!isMatch) return null;

    return {
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        role: user.role,
    };

}


export async function verifySessionCookie(req: NextRequest | { headers: Headers }) {
    try {
        const token = await getToken({
            // @ts-expect-error
            req,
            secret: NEXTAUTH_SECRET,
        });

        if (!token) return null;
        return token;
    } catch (err) {
        console.error("verifySessionCookie error:", err);
        return null;
    }
}
