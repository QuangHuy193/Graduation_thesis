import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/function";

export async function PUT(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = await params;
        const body = await req.json();
        const normal = Number(body.normal);
        const student = Number(body.student);
        if (Number.isNaN(normal) || Number.isNaN(student)) {
            return errorResponse("Giá không hợp lệ");
        }
        if (normal == null || student == null) {
            return errorResponse("Thiếu giá vé");
        }

        const [normalRows]: any = await db.query(
            `UPDATE price_reality 
       SET price_final = ? 
       WHERE showtime_id = ? AND ticket_type_id = 1`,
            [normal, id]
        );

        await db.query(
            `UPDATE price_reality 
       SET price_final = ? 
       WHERE showtime_id = ? AND ticket_type_id = 2`,
            [student, id]
        );
        console.log("normal:", normal);
        console.log("id update:", id);
        console.log("affectedRows normal:", normalRows.affectedRows);
        return successResponse(normalRows[0], "true", 201);
    } catch (err) {
        console.error(err);
        return errorResponse("Lỗi server", 500);
    }
}
