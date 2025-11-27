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

        const { oldPassword, newPassword } = body as {
            oldPassword?: string;
            newPassword?: string;
        };

        if (!oldPassword || !newPassword)
            return errorResponse("oldPassword and newPassword are required", 400);

        // Basic validation for new password
        if (typeof newPassword !== "string" || newPassword.length < 8) {
            return errorResponse("newPassword must be at least 8 characters", 400);
        }

        // Get existing password hash from DB
        const [rows] = await db.execute(
            "SELECT password FROM users WHERE user_id = ? LIMIT 1",
            [id]
        );

        const userRow = Array.isArray(rows) ? (rows as any[])[0] : undefined;
        const currentHash = userRow?.password;

        if (!currentHash) {
            // user not found or no password stored
            return errorResponse("User not found or password not set", 404);
        }

        // Compare old password with stored hash
        const match = await bcrypt.compare(oldPassword, currentHash);
        if (!match) {
            return errorResponse("Old password is incorrect", 401);
        }

        // Hash new password
        const newHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

        // Update in DB
        const [result] = await db.execute(
            "UPDATE users SET password = ? WHERE user_id = ?",
            [newHash, id]
        );

        const affectedRows = (result as any)?.affectedRows ?? 0;
        if (affectedRows === 0) {
            return errorResponse("Failed to update password", 500);
        }

        return successResponse({ updated: true }, "Password updated", 200);
    } catch (err) {
        console.error("Change password error:", err);
        return errorResponse(String(err ?? "Unknown error"), 500);
    }
}
