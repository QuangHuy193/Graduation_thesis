import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export type PromotionRule = {
    rule_id: number;
    name: string;
    image: string | null;
    start_time: string | null;
    end_time: string | null;
    priority: number;
    enable: number;
    display: number | null;
    description: string | null;
    isHoliday: number | null;
};

export async function GET() {
    try {
        const [rows] = await db.query(`
      SELECT
        rule_id,
        name,
        start_time,
        end_time,
        priority,
        enable,
        display,
        description,
        isHoliday
      FROM promotion_rule
      ORDER BY priority ASC, rule_id DESC
    `);

        return NextResponse.json({
            success: true,
            data: rows
        });
    } catch (error) {
        console.error("Get promotions error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to fetch promotions" },
            { status: 500 }
        );
    }
}
