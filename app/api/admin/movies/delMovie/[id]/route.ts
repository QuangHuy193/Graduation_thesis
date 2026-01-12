// app/api/movies/admin/delMovie/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db"; // mysql2/promise pool

export async function DELETE(req: NextRequest, context: { params: Promise<{ id?: string }> }) {
    try {
        const { id: idRaw } = await context.params; // <<-- phải await params
        const id = idRaw ? Number(idRaw) : NaN;

        if (!idRaw || !Number.isInteger(id) || id <= 0) {
            return NextResponse.json({ success: false, error: "movie_id không hợp lệ" }, { status: 400 });
        }
        const body = await req.json().catch(() => ({}));
        const user_id = body?.user_id;
        const connection = await db.getConnection();
        try {
            // kiểm tra tồn tại
            const [rowsCheck]: any = await connection.query("SELECT movie_id FROM movies WHERE movie_id = ? LIMIT 1", [id]);
            if (!rowsCheck || rowsCheck.length === 0) {
                return NextResponse.json({ success: false, error: `Movie id ${id} không tồn tại` }, { status: 404 });
            }

            await connection.beginTransaction();
            await connection.execute(`UPDATE movies SET user_id = ? WHERE movie_id = ?`, [user_id, id]);
            // xóa liên kết trong movie_genres và movie_actors trước
            await connection.execute("DELETE FROM movie_genre WHERE movie_id = ?", [id]);
            await connection.execute("DELETE FROM movie_actor WHERE movie_id = ?", [id]);

            // (tùy chọn) xóa images nếu cần:
            // await connection.execute("DELETE FROM images WHERE movie_id = ?", [id]);

            // xóa movie
            const [delResult]: any = await connection.execute("DELETE FROM movies WHERE movie_id = ?", [id]);
            if (delResult?.affectedRows === 0) {
                await connection.rollback();
                return NextResponse.json({ success: false, error: "Không xóa được movie (đã bị xóa trước đó?)" }, { status: 404 });
            }

            await connection.commit();
            return NextResponse.json({ success: true }, { status: 200 });
        } catch (err: any) {
            try { await connection.rollback(); } catch (_) { }
            console.error("Delete movie error:", err);
            return NextResponse.json({ success: false, error: "Lỗi server khi xóa movie", detail: err?.message ?? String(err) }, { status: 500 });
        } finally {
            try { connection.release(); } catch (_) { }
        }
    } catch (err: any) {
        console.error("Route error:", err);
        return NextResponse.json({ success: false, error: "Yêu cầu không hợp lệ" }, { status: 400 });
    }
}
