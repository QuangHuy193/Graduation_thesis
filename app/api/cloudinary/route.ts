// app/api/cloudinary/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: Request) {
    try {
        const body = await req.json();

        const url = body.url as string | undefined;
        const public_id = body.public_id as string | undefined;
        const caption = (body.caption as string | undefined) ?? null;

        if (!url || !public_id) {
            return NextResponse.json({ error: "Missing url or public_id" }, { status: 400 });
        }

        // Lưu vào MySQL (mysql2/promise pool)
        const conn = await db.getConnection();
        try {
            const [result] = await conn.execute(
                "INSERT INTO images (url, public_id, caption) VALUES (?, ?, ?)",
                [url, public_id, caption]
            );
            conn.release();

            const insertId = (result as any)?.insertId ?? null;

            return NextResponse.json({
                success: true,
                insertId,
                image: { url, public_id, caption },
            });
        } catch (dbErr) {
            try { conn.release(); } catch { }
            return NextResponse.json({ error: "DB error", details: String(dbErr) }, { status: 500 });
        }
    } catch (err) {
        return NextResponse.json({ error: "Invalid request", details: String(err) }, { status: 400 });
    }
}
