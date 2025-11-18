// app/api/movies/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db"; // pool mysql2/promise
import { MovieFullITF } from "@/lib/interface/movieInterface";
// export interface MovieFullITF {
//     movie_id: number;
//     name: string;
//     image: string;
//     trailer_url: string;
//     description: string;
//     release_date: Date;
//     age_require: number;
//     country: string;
//     subtitle: string;
//     duration: number;
//     status: number;
//     price_base?: number | 0;
//     genres?: string[] | [];
//     actors?: string[] | [];
// }

type RawPayload = Partial<MovieFullITF> & { country?: string | number; subtitle?: string | number };

// ---- helper validators / parsers ----
function isIntegerString(v: any) {
    if (v == null) return false;
    const n = Number(v);
    return Number.isInteger(n) && String(n) === String(v);
}

function parseDateToMySQLDatetime(d?: string | Date | null) {
    if (!d) return null;
    const date = typeof d === "string" ? new Date(d) : d;
    if (Number.isNaN(date.getTime())) return null;
    // MySQL DATETIME format: YYYY-MM-DD HH:MM:SS
    const iso = date.toISOString(); // UTC
    return iso.slice(0, 19).replace("T", " ");
}

// ---- main POST handler ----
export async function POST(req: NextRequest) {
    try {
        const body = (await req.json()) as RawPayload;

        // basic validation
        if (!body || typeof body !== "object") {
            return NextResponse.json({ success: false, error: "Body phải là JSON object" }, { status: 400 });
        }
        if (!body.name || typeof body.name !== "string" || !body.name.trim()) {
            return NextResponse.json({ success: false, error: "Trường 'name' là bắt buộc" }, { status: 400 });
        }

        // prepare fields
        const name = body.name.trim();
        const description = body.description ? String(body.description) : null;
        const image = body.image ? String(body.image) : "";
        const trailer_url = body.trailer_url ? String(body.trailer_url) : null;
        const release_date_sql = parseDateToMySQLDatetime(body.release_date as any);
        const price_base = body.price_base != null ? Number(body.price_base) : null;
        const status = body.status != null ? Number(body.status) : null;
        const age_require = body.age_require != null ? Number(body.age_require) : null;
        const duration = body.duration != null ? Number(body.duration) : null;

        const genres = Array.isArray(body.genres) ? body.genres.map(String).map(s => s.trim()).filter(Boolean) : [];
        const actors = Array.isArray(body.actors) ? body.actors.map(String).map(s => s.trim()).filter(Boolean) : [];

        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            // --- resolve country_id ---
            let country_id: number | null = null;
            if (body.country != null && body.country !== "") {
                if (isIntegerString(body.country)) {
                    country_id = Number(body.country);
                    // verify exists
                    const [rc]: any = await connection.query("SELECT 1 FROM `country` WHERE country_id = ? LIMIT 1", [country_id]);
                    if ((rc || []).length === 0) {
                        await connection.rollback();
                        return NextResponse.json({ success: false, error: `country_id ${country_id} không tồn tại` }, { status: 400 });
                    }
                } else {
                    // treat as name -> lookup
                    const nameCountry = String(body.country).trim();
                    const [rowsC]: any = await connection.query("SELECT country_id FROM `country` WHERE name = ? LIMIT 1", [nameCountry]);
                    if ((rowsC || []).length === 0) {
                        await connection.rollback();
                        return NextResponse.json({ success: false, error: `Không tìm thấy country có tên '${nameCountry}'` }, { status: 400 });
                    }
                    country_id = Number(rowsC[0].country_id);
                }
            }

            // --- resolve subtitle_id (assume subtitle stored in same table `country` per your original schema) ---
            let subtitle_id: number | null = null;
            if (body.subtitle != null && body.subtitle !== "") {
                if (isIntegerString(body.subtitle)) {
                    subtitle_id = Number(body.subtitle);
                    const [rs]: any = await connection.query("SELECT 1 FROM `country` WHERE country_id = ? LIMIT 1", [subtitle_id]);
                    if ((rs || []).length === 0) {
                        await connection.rollback();
                        return NextResponse.json({ success: false, error: `subtitle_id ${subtitle_id} không tồn tại` }, { status: 400 });
                    }
                } else {
                    const nameSub = String(body.subtitle).trim();
                    const [rowsS]: any = await connection.query("SELECT country_id FROM `country` WHERE name = ? LIMIT 1", [nameSub]);
                    if ((rowsS || []).length === 0) {
                        await connection.rollback();
                        return NextResponse.json({ success: false, error: `Không tìm thấy subtitle (country) có tên '${nameSub}'` }, { status: 400 });
                    }
                    subtitle_id = Number(rowsS[0].country_id);
                }
            }

            // --- insert into movies ---
            // Note: if your movies table doesn't have `image`/`genres`/`actors` columns, we don't try to write them here.
            const insertSql = `
        INSERT INTO movies
          (name, description, trailer_url, release_date, price_base, status, age_require, country_id, subtitle_id, duration)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
            const params = [
                name,
                description,
                trailer_url,
                release_date_sql,
                price_base,
                status,
                age_require,
                country_id,
                subtitle_id,
                duration,
            ];

            const [result]: any = await connection.execute(insertSql, params);
            const movie_id = Number(result.insertId);
            if (!movie_id) {
                await connection.rollback();
                return NextResponse.json({ success: false, error: "Không thể tạo movie" }, { status: 500 });
            }

            // --- handle image field ---
            // If you have an `image` column in movies, uncomment and run update:
            // await connection.execute("UPDATE movies SET image = ? WHERE movie_id = ?", [image, movie_id]);

            // --- handle genres/actors linking tables (optional) ---
            // This block assumes you have the following tables:
            //   genres(genre_id, name), actors(actor_id, name),
            //   movie_genres(movie_id, genre_id), movie_actors(movie_id, actor_id)
            // If you don't have them, these queries will fail — adjust or remove as needed.
            if (genres.length > 0) {
                for (const gName of genres) {
                    // find or create genre
                    const [rg]: any = await connection.query("SELECT genre_id FROM genres WHERE name = ? LIMIT 1", [gName]);
                    let genre_id: number;
                    if ((rg || []).length > 0) {
                        genre_id = Number(rg[0].genre_id);
                    } else {
                        const [insG]: any = await connection.execute("INSERT INTO genres (name) VALUES (?)", [gName]);
                        genre_id = Number(insG.insertId);
                    }
                    // link
                    await connection.execute("INSERT IGNORE INTO movie_genre (movie_id, genre_id) VALUES (?, ?)", [movie_id, genre_id]);
                }
            }

            if (actors.length > 0) {
                for (const aName of actors) {
                    const [ra]: any = await connection.query("SELECT actor_id FROM actors WHERE name = ? LIMIT 1", [aName]);
                    let actor_id: number;
                    if ((ra || []).length > 0) {
                        actor_id = Number(ra[0].actor_id);
                    } else {
                        const [insA]: any = await connection.execute("INSERT INTO actors (name) VALUES (?)", [aName]);
                        actor_id = Number(insA.insertId);
                    }
                    await connection.execute("INSERT IGNORE INTO movie_actor (movie_id, actor_id) VALUES (?, ?)", [movie_id, actor_id]);
                }
            }

            await connection.commit();

            // build response MovieFullITF
            // we return country/subtitle as the original provided string if provided, otherwise empty string
            const resObj: MovieFullITF = {
                movie_id,
                name,
                image: image || "",
                trailer_url: trailer_url || "",
                description: description || "",
                release_date: release_date_sql ? new Date(release_date_sql) : ("" as any),
                age_require: age_require ?? 0,
                country: body.country != null ? String(body.country) : "",
                subtitle: body.subtitle != null ? String(body.subtitle) : "",
                duration: duration ?? 0,
                status: status ?? 0,
                price_base: price_base ?? 0,
                genres: genres,
                actors: actors,
            };

            return NextResponse.json({ success: true, movie: resObj }, { status: 201 });
        } catch (err: any) {
            await connection.rollback();
            console.error("DB error:", err?.message ?? err);
            // if genres/actors tables missing, developer may want to adjust — return 500
            return NextResponse.json({ success: false, error: "Lỗi khi chèn vào DB", detail: err?.message ?? String(err) }, { status: 500 });
        } finally {
            connection.release();
        }
    } catch (err: any) {
        console.error("API error:", err?.message ?? err);
        return NextResponse.json({ success: false, error: "Yêu cầu không hợp lệ hoặc server error", detail: err?.message ?? String(err) }, { status: 400 });
    }
}
