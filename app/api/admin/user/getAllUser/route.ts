// app/api/admin/users/route.ts
// import { NextResponse } from "next/server";
import { db } from "@/lib/db"; // mysql2 / prisma / pool bạn đang dùng
import { successResponse, errorResponse } from "@/lib/function";
export async function GET() {
    try {
        const [rows] = await db.execute(
            `
      SELECT 
        user_id,
        name,
        phone_number,
        email,
        birthday,
        age,
        vip,
        point,
        status,
        role,
        created_at,
        updated_at
      FROM users
      ORDER BY created_at DESC
      `
        );


        return successResponse(rows, "true", 201);
    } catch (error) {
        console.error("GET USERS ERROR:", error);
        return errorResponse("false", 500);
    }
}
