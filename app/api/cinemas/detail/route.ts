import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const [rows] = await db.query(
      "SELECT cinema_id, name, specific_address, ward, province, price_base, status FROM cinemas"
    );
    return NextResponse.json(rows);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Error fetching cinemas" },
      { status: 500 }
    );
  }
}
