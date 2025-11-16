// app/api/movies/list/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db"; // hoặc import db from "@/lib/db";

export async function GET() {
    try {
        const conn = await db.getConnection();
        try {
            const [rows] = await conn.execute(
                "SELECT movie_id AS id, name FROM movies ORDER BY name"
            );
            conn.release();

            return NextResponse.json(rows);
        } catch (err) {
            try { conn.release(); } catch { }
            return NextResponse.json(
                { error: "DB error", details: String(err) },
                { status: 500 }
            );
        }
    } catch (err) {
        return NextResponse.json(
            { error: "DB Connection failed", details: String(err) },
            { status: 500 }
        );
    }
}