import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/function";


export async function POST(req: NextRequest) {
    try {
        const body = await req.json(); // { userId: 123 }
        const userId = body?.user_id;
        // if (!userId) return NextResponse.json({ success: false, error: "Missing userId" }, { status: 400 });
        if (!userId) return errorResponse("Missing user_id", 400);

        const [rows] = await db.query("SELECT `status` FROM `users` WHERE `user_id` = ? LIMIT 1", [userId]);
        const result = Array.isArray(rows) && rows.length ? (rows[0] as any) : null;

        // if (!result) return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
        if (!result) return errorResponse("User not found", 404);
        const isActive = Number(result.status) === 1;
        // return NextResponse.json({ success: true, user_id: userId, active: isActive, status: Number(result.status) });
        return successResponse({ user_id: userId, active: isActive }, "", 201);
    } catch (err) {
        console.error("status-by-id error:", err);
        // return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
        return errorResponse("Server error", 500);
    }
}
