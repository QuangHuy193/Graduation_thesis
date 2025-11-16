// app/api/cloudinary/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: Request) {
    let conn: any = null;

    try {
        const body = await req.json();

        const url = body.url as string | undefined;
        const public_id = body.public_id as string | undefined;
        const movie_id_raw = body.movie_id ?? null;
        const type_from_body = body.type as string | undefined;

        if (!url || !public_id) {
            return NextResponse.json(
                { error: "Missing url or public_id" },
                { status: 400 }
            );
        }

        // movie_id -> number | null
        const movie_id =
            movie_id_raw === null || movie_id_raw === undefined
                ? null
                : Number(movie_id_raw);

        // type: ưu tiên client gửi, còn không -> mặc định poster
        const type = type_from_body ?? "poster";

        conn = await db.getConnection();

        try {
            const sql = `
        INSERT INTO images (movie_id, url, public_id, type, created_at)
        VALUES (?, ?, ?, ?, NOW())
      `;

            const params = [movie_id, url, public_id, type];

            const [result] = await conn.execute(sql, params);

            try {
                conn.release();
            } catch (_) { }

            return NextResponse.json(
                {
                    success: true,
                    insertId: (result as any)?.insertId ?? null,
                    image: {
                        url,
                        public_id,
                        movie_id,
                        type,
                    },
                },
                { status: 200 }
            );
        } catch (dbErr) {
            try {
                conn.release();
            } catch (_) { }
            return NextResponse.json(
                { error: "DB error", details: String(dbErr) },
                { status: 500 }
            );
        }
    } catch (err) {
        try {
            if (conn) conn.release();
        } catch (_) { }

        return NextResponse.json(
            { error: "Invalid request", details: String(err) },
            { status: 400 }
        );
    }
}