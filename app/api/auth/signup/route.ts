import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { computeAge } from "@/lib/function";
type ReqBody = {
    otpId?: number;
    // Nếu bạn muốn fallback, có thể cho phép email trong body để thêm kiểm tra,
    // nhưng an toàn nhất là chỉ dùng otpId.
};

export async function POST(req: Request) {
    let conn;
    try {
        const body = (await req.json()) as ReqBody;
        const otpId = body?.otpId;

        if (!otpId || typeof otpId !== "number") {
            return NextResponse.json({ success: false, message: "Thiếu otpId hợp lệ" }, { status: 400 });
        }

        conn = await db.getConnection();
        await conn.beginTransaction();

        // Lấy record OTP (đã consumed) để đảm bảo đã verify.
        const [rows] = await conn.execute(
            `SELECT id, user_id, consumed, user_data
       FROM otps
       WHERE id = ?
       FOR UPDATE`,
            [otpId]
        ) as any;

        if (!rows || rows.length === 0) {
            await conn.rollback();
            return NextResponse.json({ success: false, message: "Không tìm thấy mã OTP" }, { status: 400 });
        }

        const rec = rows[0];

        // Phải là record đã được verify (consumed = 1)
        if (!rec.consumed) {
            await conn.rollback();
            return NextResponse.json({ success: false, message: "OTP chưa được xác thực" }, { status: 400 });
        }

        // Nếu otps.user_id != NULL => đã dùng để tạo user trước đó
        if (rec.user_id) {
            await conn.rollback();
            return NextResponse.json({ success: false, message: "OTP này đã được sử dụng để tạo tài khoản" }, { status: 409 });
        }

        let userData: any = null;
        try {
            console.log("[signup-from-otp] raw user_data type:", typeof rec.user_data);
            if (rec.user_data === null || rec.user_data === undefined) {
                userData = null;
            } else if (typeof rec.user_data === "string") {
                // Trim để loại BOM/whitespace
                let s = rec.user_data.trim();

                // Nếu string được double-escape (ví dụ '"{\"name\":...}"'), parse nhiều lần cho đến khi thành object
                // Nhưng giới hạn số lần để tránh vòng lặp vô hạn (max 3 lần)
                let attempts = 0;
                while (typeof s === "string" && attempts < 3) {
                    try {
                        const parsed = JSON.parse(s);
                        // nếu parsed vẫn là string -> continue, nếu object -> assign và break
                        if (typeof parsed === "string") {
                            s = parsed;
                            attempts++;
                            continue;
                        } else {
                            userData = parsed;
                            break;
                        }
                    } catch (e) {
                        // không parse được nữa -> cố gắng break
                        console.warn("[signup-from-otp] JSON.parse failed at attempt", attempts, e);
                        break;
                    }
                }
                // Nếu vòng while không set userData (parsed unsuccessful), cố gắng parse once more
                if (!userData) {
                    try {
                        userData = JSON.parse(s);
                    } catch (e) {
                        console.error("Final JSON.parse failed for user_data string:", e, "raw:", s);
                        throw e;
                    }
                }
            } else if (typeof rec.user_data === "object") {
                userData = rec.user_data;
            } else {
                throw new Error("Unexpected user_data type: " + typeof rec.user_data);
            }
        } catch (e) {
            console.error("Invalid user_data JSON:", e, "raw:", rec.user_data);
            await conn.rollback();
            return NextResponse.json({ success: false, message: "Dữ liệu người dùng không hợp lệ" }, { status: 500 });
        }

        // ---- Kiểm tra bắt buộc ----
        if (!userData || !userData.email || !userData.password) {
            await conn.rollback();
            return NextResponse.json({ success: false, message: "Dữ liệu người dùng thiếu thông tin bắt buộc" }, { status: 400 });
        }
        //Tính toán tuổi
        const age = computeAge(userData.birthday);
        if (age === null) {
            await conn.rollback();
            return NextResponse.json({ success: false, message: "Ngày sinh không hợp lệ" }, { status: 400 });
        }
        // ---- Thay thế phần INSERT: dùng NOW() trong SQL để set created_at ----
        // Chuẩn bị insert (tùy schema users của bạn)
        const fields = ["name", "email", "password", "phone_number", "birthday", "age", "role", "created_at"];
        // thay vì đưa created_at từ JS, ta sử dụng NOW() trực tiếp trong SQL
        const placeholders = fields.map((f) => (f === "created_at" ? "NOW()" : "?")).join(", ");
        const values = [
            userData.name ?? null,
            userData.email,
            userData.password, // Đã hashed khi lưu user_data
            userData.phone_number ?? null,
            userData.birthday ?? null,
            age,
            userData.role ?? "user",
            // no value for created_at, placeholder was replaced by NOW() so don't push anything here
        ];

        // Chú ý: khi dùng placeholders như trên, values length phải match số "?" trong placeholders.
        // Vì ta thay created_at bằng NOW(), số "?" = fields.length - 1
        try {
            const [insRes] = await conn.execute(
                `INSERT INTO users (${fields.join(", ")}) VALUES (${placeholders})`,
                values
            ) as any;

            const newUserId = insRes?.insertId ?? null;

            // Link otps.user_id -> newUserId (để biết record này đã dùng)
            await conn.execute(
                `UPDATE otps SET user_id = ? WHERE id = ?`,
                [newUserId, otpId]
            );

            await conn.commit();
            return NextResponse.json({ success: true, message: "Đăng ký tài khoản thành công.", userId: newUserId }, { status: 201 });
        } catch (insertErr: any) {
            console.error("Insert user error:", insertErr);
            try { await conn.rollback(); } catch (_) { }
            if (insertErr && insertErr.code === "ER_DUP_ENTRY") {
                return NextResponse.json({ success: false, message: "Email hoặc số điện thoại đã tồn tại" }, { status: 409 });
            }
            return NextResponse.json({ success: false, message: "Không thể tạo tài khoản. Vui lòng thử lại." }, { status: 500 });
        }
    } catch (err) {
        console.error("Signup (from otp) error:", err);
        if (conn) {
            try { await conn.rollback(); } catch (_) { }
        }
        return NextResponse.json({ success: false, message: "Lỗi server" }, { status: 500 });
    } finally {
        if (conn) conn?.release?.();
    }
}
