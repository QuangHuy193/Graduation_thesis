// app/api/movies/bulk/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db"; // mysql2/promise pool
import type { MovieFullITF } from "@/lib/interface/movieInterface";

/**
 * Raw payload per movie accepted by this endpoint.
 * Fields are optional — we'll validate per-movie.
 */
type RawPayload = Partial<{
    name: string;
    image?: string;
    trailer_url?: string;
    description?: string;
    release_date?: string | Date | null; // accept ISO yyyy-mm-dd or Date
    age_require?: number | string | null;
    country?: string | number | null; // name or id
    subtitle?: string | number | null; // name or id
    duration?: number | string | null;
    status?: number | string | null;
    genres?: string[] | string | null; // array of names OR comma-separated string
    actors?: string[] | string | null;
}>;

/** helper */
function isIntegerString(v: any) {
    if (v == null) return false;
    return /^-?\d+$/.test(String(v).trim());
}

function parseDateToMySQLDatetime(d?: string | Date | null) {
    if (!d) return null;
    const date = typeof d === "string" ? new Date(d) : d;
    if (Number.isNaN(date.getTime())) return null;
    const iso = date.toISOString(); // UTC
    return iso.slice(0, 19).replace("T", " ");
}

/** normalize genres/actors field to string[] */
function normalizeStringOrArrayField(v?: string[] | string | null) {
    if (!v) return [];
    if (Array.isArray(v)) return v.map((s) => String(s).trim()).filter(Boolean);
    // string: could be comma/semicolon separated
    return String(v)
        .split(/[,;|、]/)
        .map((s) => s.trim())
        .filter(Boolean);
}

/**
 * Insert single movie using provided connection (must be active).
 * Returns object { success: boolean, movie?: MovieFullITF, error?: string }
 */
async function insertSingleMovie(connection: any, payload: RawPayload) {
    // Basic validation
    if (!payload || typeof payload !== "object") {
        return { success: false, error: "Invalid payload" };
    }
    if (!payload.name || typeof payload.name !== "string" || !payload.name.trim()) {
        return { success: false, error: "Missing required field 'name'" };
    }

    const name = String(payload.name).trim();
    const description = payload.description ? String(payload.description) : null;
    const image = payload.image ? String(payload.image) : "";
    const trailer_url = payload.trailer_url ? String(payload.trailer_url) : null;
    const release_date_sql = parseDateToMySQLDatetime(payload.release_date as any);
    const status = payload.status != null ? Number(payload.status) : 1; // default active
    const age_require = payload.age_require != null ? Number(payload.age_require) : null;
    const duration = payload.duration != null ? Number(payload.duration) : null;

    const genres = normalizeStringOrArrayField(payload.genres);
    const actors = normalizeStringOrArrayField(payload.actors);

    // Resolve country_id
    let country_id: number | null = null;
    if (payload.country != null && payload.country !== "") {
        if (isIntegerString(payload.country)) {
            country_id = Number(payload.country);
            const [rc]: any = await connection.query("SELECT 1 FROM `country` WHERE country_id = ? LIMIT 1", [country_id]);
            if ((rc || []).length === 0) {
                return { success: false, error: `country_id ${country_id} không tồn tại` };
            }
        } else {
            const nameCountry = String(payload.country).trim();
            const [rowsC]: any = await connection.query("SELECT country_id FROM `country` WHERE name = ? LIMIT 1", [nameCountry]);
            if ((rowsC || []).length === 0) {
                return { success: false, error: `Không tìm thấy country có tên '${nameCountry}'` };
            }
            country_id = Number(rowsC[0].country_id);
        }
    }

    // Resolve subtitle_id (if stored in same table)
    let subtitle_id: number | null = null;
    if (payload.subtitle != null && payload.subtitle !== "") {
        if (isIntegerString(payload.subtitle)) {
            subtitle_id = Number(payload.subtitle);
            const [rs]: any = await connection.query("SELECT 1 FROM `country` WHERE country_id = ? LIMIT 1", [subtitle_id]);
            if ((rs || []).length === 0) {
                return { success: false, error: `subtitle_id ${subtitle_id} không tồn tại` };
            }
        } else {
            const nameSub = String(payload.subtitle).trim();
            const [rowsS]: any = await connection.query("SELECT country_id FROM `country` WHERE language = ? LIMIT 1", [nameSub]);
            if ((rowsS || []).length === 0) {
                return { success: false, error: `Không tìm thấy subtitle có tên '${nameSub}'` };
            }
            subtitle_id = Number(rowsS[0].country_id);
        }
    }

    // Insert into movies
    const insertSql = `
    INSERT INTO movies
      (name, description, trailer_url, release_date, status, age_require, country_id, subtitle_id, duration)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
    const params = [name, description, trailer_url, release_date_sql, status, age_require, country_id, subtitle_id, duration];

    const [result]: any = await connection.execute(insertSql, params);
    const movie_id = Number(result.insertId);
    if (!movie_id) {
        return { success: false, error: "Không thể tạo movie" };
    }

    // Optionally update image if you use image column
    if (image) {
        try {
            await connection.execute("UPDATE movies SET image = ? WHERE movie_id = ?", [image, movie_id]);
        } catch (e: any) {
            // non-fatal: continue but note the error
            // (we won't fail the whole movie for image update error)
            console.warn("Warning: update image failed", e?.message ?? e);
        }
    }

    // Handle genres / actors (find or create + linking)
    if (genres.length > 0) {
        for (const gName of genres) {
            const [rg]: any = await connection.query("SELECT genre_id FROM genres WHERE name = ? LIMIT 1", [gName]);
            let genre_id: number;
            if ((rg || []).length > 0) {
                genre_id = Number(rg[0].genre_id);
            } else {
                const [insG]: any = await connection.execute("INSERT INTO genres (name) VALUES (?)", [gName]);
                genre_id = Number(insG.insertId);
            }
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

    // Build response object
    const resObj: MovieFullITF = {
        movie_id,
        name,
        image: image || "",
        trailer_url: trailer_url || "",
        description: description || "",
        release_date: release_date_sql ? new Date(release_date_sql) : ("" as any),
        age_require: age_require ?? 0,
        country: payload.country != null ? String(payload.country) : "",
        subtitle: payload.subtitle != null ? String(payload.subtitle) : "",
        duration: duration ?? 0,
        status: status ?? 0,
        genres,
        actors,
    };

    return { success: true, movie: resObj };
}

/** POST handler */
export async function POST(req: NextRequest) {
    const url = new URL(req.url);
    const atomic = url.searchParams.get("atomic") === "true"; // ?atomic=true for all-or-nothing
    const connection = await db.getConnection();

    try {
        const body = await req.json();

        if (!body) {
            return NextResponse.json({ success: false, error: "Empty body" }, { status: 400 });
        }

        // support single object or array
        const items: RawPayload[] = Array.isArray(body) ? body : [body];

        const results: any[] = [];

        if (atomic) {
            // all-or-nothing: single transaction for all items
            try {
                await connection.beginTransaction();
                for (let i = 0; i < items.length; i++) {
                    const payload = items[i];
                    const r = await insertSingleMovie(connection, payload);
                    if (!r.success) {
                        // rollback and return failure
                        await connection.rollback();
                        return NextResponse.json({ success: false, error: `Row ${i} failed: ${r.error}`, details: r }, { status: 400 });
                    }
                    results.push({ index: i, success: true, movie: r.movie });
                }
                await connection.commit();
                return NextResponse.json({ success: true, results }, { status: 201 });
            } catch (err: any) {
                await connection.rollback();
                console.error("Atomic insert error:", err?.message ?? err);
                return NextResponse.json({ success: false, error: "Atomic insert failed", detail: err?.message ?? String(err) }, { status: 500 });
            } finally {
                connection.release();
            }
        } else {
            // non-atomic: process each item individually (each with its own transaction)
            for (let i = 0; i < items.length; i++) {
                const payload = items[i];
                try {
                    await connection.beginTransaction();
                    const r = await insertSingleMovie(connection, payload);
                    if (!r.success) {
                        await connection.rollback();
                        results.push({ index: i, success: false, error: r.error });
                        continue;
                    }
                    await connection.commit();
                    results.push({ index: i, success: true, movie: r.movie });
                } catch (err: any) {
                    await connection.rollback();
                    console.error("Insert error for index", i, err?.message ?? err);
                    results.push({ index: i, success: false, error: String(err?.message ?? err) });
                }
            }
            connection.release();
            return NextResponse.json({ success: true, results }, { status: 207 }); // 207 Multi-Status
        }
    } catch (err: any) {
        connection.release();
        console.error("Bulk API error:", err?.message ?? err);
        return NextResponse.json({ success: false, error: "Invalid request or server error", detail: err?.message ?? String(err) }, { status: 400 });
    }
}
