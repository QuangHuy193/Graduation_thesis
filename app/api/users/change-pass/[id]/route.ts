import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/function";

const SALT_ROUNDS = 10;

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        if (!id) return errorResponse("Missing id", 400);

        const body = await req.json().catch(() => null);
        if (!body || typeof body !== "object")
            return errorResponse("Missing or invalid body", 400);

        const { oldPassword, newPassword, forget } = body as {
            oldPassword?: string;
            newPassword?: string;
            forget?: boolean;
        };

        if (!newPassword)
            return errorResponse("newPassword is required", 400);

        // Validate new password
        if (typeof newPassword !== "string" || newPassword.length < 8) {
            return errorResponse(
                "newPassword must be at least 8 characters",
                400
            );
        }

        // Lấy mật khẩu hiện tại
        const [rows] = await db.execute(
            "SELECT password FROM users WHERE user_id = ? LIMIT 1",
            [id]
        );

        if (rows.length === 0) {
            return errorResponse("User not found", 404);
        }

        const currentHash = rows[0].password;

        /**
         * 🔐 TRƯỜNG HỢP ĐỔI MẬT KHẨU BÌNH THƯỜNG
         * → phải kiểm tra oldPassword
         */
        if (!forget) {
            if (!oldPassword) {
                return errorResponse("oldPassword is required", 400);
            }

            const match = await bcrypt.compare(oldPassword, currentHash);
            if (!match) {
                return errorResponse("Old password is incorrect", 401);
            }
        }

        /**
         * 🔐 TRƯỜNG HỢP QUÊN MẬT KHẨU
         * → bỏ qua oldPassword
         */

        const newHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

        const [result] = await db.execute(
            "UPDATE users SET password = ? WHERE user_id = ?",
            [newHash, id]
        );

        const affectedRows = (result as any)?.affectedRows ?? 0;
        if (affectedRows === 0) {
            return errorResponse("Failed to update password", 500);
        }

        return successResponse(
            { updated: true, forget: !!forget },
            "Password updated successfully",
            200
        );
    } catch (err) {
        console.error("Change password error:", err);
        return errorResponse(String(err ?? "Unknown error"), 500);
    }
}
