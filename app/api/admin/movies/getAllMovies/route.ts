// app/api/movies/list/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db"; // hoặc import db from "@/lib/db";

export async function GET() {
    try {
        const conn = await db.getConnection();
        try {
            const [rows] = await conn.execute(
                `SELECT 
      m.movie_id, m.name, m.description, m.duration, m.trailer_url, 
      m.release_date, m.status, m.age_require,
      c1.name AS country,
      c2.language AS subtitle,
      MAX(i.url) as image,
      GROUP_CONCAT(DISTINCT g.name) AS genres,
      GROUP_CONCAT(DISTINCT a.name) AS actors
      FROM movies m
      LEFT JOIN country c1 ON m.country_id = c1.country_id
      LEFT JOIN country c2 ON m.subtitle_id = c2.country_id
      LEFT JOIN movie_genre mg ON m.movie_id = mg.movie_id
      LEFT JOIN genres g ON mg.genre_id = g.genre_id
      LEFT JOIN movie_actor ma ON m.movie_id = ma.movie_id
      LEFT JOIN actors a ON ma.actor_id = a.actor_id
      LEFT JOIN images i ON m.movie_id = i.movie_id
      GROUP BY m.movie_id`
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