import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/function";

function formatDateTimeForMySQL(d: Date) {
    // 'YYYY-MM-DD HH:MM:SS'
    const pad = (n: number) => (n < 10 ? "0" + n : String(n));
    return (
        d.getFullYear() +
        "-" +
        pad(d.getMonth() + 1) +
        "-" +
        pad(d.getDate()) +
        " " +
        pad(d.getHours()) +
        ":" +
        pad(d.getMinutes()) +
        ":" +
        pad(d.getSeconds())
    );
}

export async function PUT(req: Request, context: { params: Promise<{ id?: string }> }) {
    try {
        const { id: idRaw } = await context.params; // <<-- phải await params
        const id = idRaw ? Number(idRaw) : NaN;
        // if (!idRaw) return errorResponse("Thiếu movie id", 400);
        if (!idRaw || !Number.isInteger(id) || id <= 0) {
            return errorResponse("Thiếu movie id", 400);
        }
        const movieId = Number(id);
        if (!movieId || Number.isNaN(movieId) || movieId <= 0)
            return errorResponse("movie id không hợp lệ", 400);

        const body = await req.json().catch(() => ({}));
        if (!body || typeof body !== "object") return errorResponse("Request body không hợp lệ", 400);

        // Cho phép update các trường sau (theo schema)
        const allowedFields = [
            "name",
            "description",
            "trailer_url",
            "release_date",
            "price_base",
            "status",
            "age_require",
            "country_id",
            "subtitle_id",
            "duration",
        ];

        const setParts: string[] = [];
        const values: any[] = [];

        for (const key of allowedFields) {
            if (Object.prototype.hasOwnProperty.call(body, key) && body[key] !== undefined) {
                let val = body[key];

                // Nếu release_date được gửi dạng string/Date -> convert sang MySQL datetime string
                if (key === "release_date" && val) {
                    const d = typeof val === "string" ? new Date(val) : new Date(val);
                    if (!Number.isNaN(d.getTime())) {
                        val = formatDateTimeForMySQL(d);
                    } else {
                        // nếu release_date không parse được -> bỏ qua cập nhật trường này
                        continue;
                    }
                }

                setParts.push(`\`${key}\` = ?`);
                values.push(val);
            }
        }

        if (setParts.length === 0) {
            return errorResponse("Không có trường hợp lệ để cập nhật", 400);
        }

        // Thêm movie_id vào params
        values.push(movieId);

        const sql = `UPDATE movies SET ${setParts.join(", ")} WHERE movie_id = ? LIMIT 1`;
        const [result]: any = await db.query(sql, values);

        // Kiểm tra affectedRows
        if (result?.affectedRows === 0) {
            return errorResponse("Không tìm thấy movie hoặc không có gì thay đổi", 404);
        }

        // Lấy bản ghi vừa cập nhật để trả về
        const [rows]: any = await db.query(
            `SELECT movie_id, name, description, trailer_url, release_date, price_base, status, age_require, country_id, subtitle_id, duration
       FROM movies
       WHERE movie_id = ? LIMIT 1`,
            [movieId]
        );

        const updated = Array.isArray(rows) && rows.length > 0 ? rows[0] : null;

        return successResponse(updated, "Cập nhật movie thành công", 200);
    } catch (err: any) {
        console.error("PUT /api/movies/[id] error:", err);
        return errorResponse("Lỗi khi cập nhật movie", 500);
    }
}
