import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { errorResponse, successResponse } from "@/lib/function";

type Params = {
    params: {
        id: string;
    };
};

export async function PATCH(req: Request, { params }: Params) {
    try {
        const { id: idRaw } = await params;

        // const { id: idRaw } = await context.params; // <<-- phải await params
        const ruleId = idRaw ? Number(idRaw) : NaN;
        if (isNaN(ruleId)) {
            return NextResponse.json(
                { success: false, message: "Invalid rule_id" },
                { status: 400 }
            );
        }

        // 1. Lấy trạng thái hiện tại
        const [rows]: any = await db.query(
            "SELECT enable FROM promotion_rule WHERE rule_id = ?",
            [ruleId]
        );

        if (rows.length === 0) {
            return NextResponse.json(
                { success: false, message: "Promotion not found" },
                { status: 404 }
            );
        }

        const currentEnable = rows[0].enable;
        const newEnable = currentEnable === 1 ? 0 : 1;

        // 2. Update trạng thái mới
        await db.query(
            "UPDATE promotion_rule SET enable = ? WHERE rule_id = ?",
            [newEnable, ruleId]
        );

        return successResponse({
            rule_id: ruleId,
            enable: newEnable
        }, "true", 201);
    } catch (error) {
        console.error("Toggle promotion error:", error);
        return errorResponse("false", 500);
    }
}
