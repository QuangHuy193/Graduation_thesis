// app/api/auth/login/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import jwt, { Secret } from "jsonwebtoken";
import type { ApiResponse } from "@/lib/interface/apiInterface";
import { successResponse, errorResponse } from "@/lib/function";
import { checkUserStatus } from "@/lib/axios/checkUserStatusAPI";
const JWT_EXPIRES_IN = "7d"; // hoặc "1h" tuỳ nhu cầu

type LoginReq = {
    identifier: string; // email hoặc phone
    password: string;
};

function isEmail(v: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function isPhone(v: string) {
    return /^[0-9+\-\s]{7,20}$/.test(v);
}

export async function POST(req: Request) {
    try {
        const body = (await req.json()) as Partial<LoginReq>;

        if (!body || typeof body !== "object") {
            const res: ApiResponse<null> = { success: false, message: "Invalid body" };
            return NextResponse.json(res, { status: 400 });
        }

        const identifier = (body.identifier ?? "").toString().trim();
        const password = (body.password ?? "").toString();

        if (!identifier || !password) {
            const res: ApiResponse<null> = { success: false, message: "identifier and password are required" };
            return NextResponse.json(res, { status: 400 });
        }

        // Determine search field
        let sql = "";
        let params: any[] = [];
        if (isEmail(identifier)) {
            sql = `SELECT user_id, name, email, password, phone_number, role FROM users WHERE email = ? LIMIT 1`;
            params = [identifier.toLowerCase()];
        } else if (isPhone(identifier)) {
            sql = `SELECT user_id, name, email, password, phone_number, role FROM users WHERE phone_number = ? LIMIT 1`;
            params = [identifier];
        } else {
            const res: ApiResponse<null> = { success: false, message: "Invalid identifier format" };
            return NextResponse.json(res, { status: 400 });
        }

        const [rows]: any = await db.query(sql, params);
        const user = Array.isArray(rows) && rows.length ? rows[0] : null;
        if (!user) {
            const res: ApiResponse<null> = { success: false, message: "Không tìm thấy người dùng" };
            return NextResponse.json(res, { status: 404 });
        }

        // Compare password
        const hashed = user.password;
        const ok = await bcrypt.compare(password, hashed);
        if (!ok) {
            const res: ApiResponse<null> = { success: false, message: "Sai tên đăng nhập hoặc mật khẩu" };
            return NextResponse.json(res, { status: 401 });
        }

        // Build token payload (avoid sensitive fields)
        const payload = {
            user_id: user.user_id?.toString?.() ?? String(user.user_id),
            name: user.name,
            email: user.email,
            role: user.role ?? "user",
        };

        // --- ENSURE JWT_SECRET EXISTS ---
        const secretEnv = process.env.JWT_SECRET;
        if (!secretEnv) {
            console.error("Missing JWT_SECRET environment variable");
            const res: ApiResponse<null> = { success: false, message: "Server misconfigured" };
            return NextResponse.json(res, { status: 500 });
        }
        const jwtSecret: Secret = secretEnv;

        // Sign JWT
        const token = jwt.sign(payload, jwtSecret, { expiresIn: JWT_EXPIRES_IN });

        // Response (you may also set HttpOnly cookie here)
        const responseBody: ApiResponse<{ user: typeof payload }> = {
            success: true,
            message: "Login successful",
            data: { user: payload },
            token,
        };

        return NextResponse.json(responseBody, { status: 200 });
    } catch (err) {
        console.error("POST /api/auth/login error:", err);
        const res: ApiResponse<null> = { success: false, message: "Server error", error: String(err) };
        return NextResponse.json(res, { status: 500 });
    }
}
