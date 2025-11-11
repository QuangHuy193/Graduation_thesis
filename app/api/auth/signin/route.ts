import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { successResponse, errorResponse } from "@/lib/response";
type ReqBody = {
    name: string;
    phone_number: string;
    email: string;
    password: string;
    birthday: string;
    age?: number;
    vip?: boolean;
    point?: string;
    status: number;
    role?: "superadmin" | "admin" | "user";
}
function validateEmail(email: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePhone(phone: string) {

    return /^[0-9+\-\s]{10}$/.test(phone);
}
//Tính toán tuổi từ ngày sinh
function computeAgeFromBirthday(birthIso: string) {
    const d = new Date(birthIso);
    if (Number.isNaN(d.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - d.getFullYear();
    const m = today.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
    return age;
}

//Đăng kí user
export async function POST(req: Request) {
    try {
        const payload = (await req.json()) as unknown;
        // Basic runtime shape check
        if (typeof payload !== "object" || payload === null) {
            return NextResponse.json({ message: "Invalid body" }, { status: 400 });
        }
        const body = payload as ReqBody;

        const name = (body.name ?? "").trim();
        const birthday = body.birthday ?? "";
        const email = (body.email ?? "").trim().toLowerCase();
        const phone = (body.phone_number ?? "").trim();
        const password = body.password ?? "";
        //Kiểm tra trong payload có gửi role không? Nếu có thì lưu
        const role = body.role?.trim() || undefined;


        // Validate required fields
        // Validate name
        if (!name) {
            return NextResponse.json({ message: "Name is required" }, { status: 400 });
        }
        // Validate email
        if (!email || !validateEmail(email)) {
            return NextResponse.json({ message: "Invalid email" }, { status: 400 });
        }
        // Validate pass
        if (!password || password.length < 8) {
            return NextResponse.json({ message: "Password must be at least 8 characters" }, { status: 400 });
        }
        // Validate birthday
        if (!birthday) {
            return NextResponse.json({ message: "Birthday is required" }, { status: 400 });
        }
        // Validate phone
        if (phone && !validatePhone(phone)) {
            return NextResponse.json({ message: "Số điện thoại không hợp lệ" }, { status: 400 });
        }
        //Kiểm tra ngày sinh
        const parsedBirthday = new Date(birthday);
        if (Number.isNaN(parsedBirthday.getTime())) {
            return NextResponse.json({ message: "Ngày sinh không hợp lệ" }, { status: 400 });
        }
        // Tính toán tuổi
        const computedAge = computeAgeFromBirthday(parsedBirthday.toISOString());
        if (computedAge === null) {
            return NextResponse.json({ message: "Không thể tính tuổi" }, { status: 400 });
        }
        //Validate age
        if (computedAge <= 0 || computedAge > 120) {
            return NextResponse.json({ message: "Tuổi không hợp lệ" }, { status: 400 });
        }
        // Check duplicate email
        const [emailRows]: any = await db.query("SELECT user_id FROM users WHERE email = ? LIMIT 1", [email]);
        if (Array.isArray(emailRows) && emailRows.length) {
            return NextResponse.json({ message: "Email already in use" }, { status: 409 });
        }
        // Check duplicate email
        if (phone) {
            const [phoneRows]: any = await db.query("SELECT user_id FROM users WHERE phone_number = ? LIMIT 1", [phone]);
            if (Array.isArray(phoneRows) && phoneRows.length) {
                return NextResponse.json({ message: "Phone number already in use" }, { status: 409 });
            }
        }
        // Hash password
        const hashed = await bcrypt.hash(password, 10);
        // Insert into DB
        const fields = ["name", "email", "password", "phone_number", "birthday", "age"];
        const values: any[] = [name, email, hashed, phone || null, parsedBirthday.toISOString().slice(0, 10), computedAge];

        if (role) {
            fields.push("role");
            values.push(role);
        }

        const placeholders = fields.map(() => "?").join(", ");
        const sql = `INSERT INTO users (${fields.join(", ")}) VALUES (${placeholders})`;

        const [result]: any = await db.query(sql, values);
        const userId = result?.insertId ?? null;

        return successResponse({ userId }, "Đăng ký thành công", 201);
    } catch (err) {
        console.error("POST /api/users error:", err);
        return errorResponse("Lỗi server", 500);
    }
}