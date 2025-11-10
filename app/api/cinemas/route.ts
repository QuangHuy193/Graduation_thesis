import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const [rows] = await db.query("SELECT name FROM cinemas LIMIT 10");
        return NextResponse.json(rows);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ message: "Error fetching cinemas" }, { status: 500 });
    }
}