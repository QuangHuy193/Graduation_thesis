import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const [rows] = await db.query(
      `SELECT c.cinema_id, c.name, c.specific_address, c.ward, c.province, c.price_base, c.status,
      msc.movie_screen_id
      FROM cinemas c
      LEFT JOIN movie_screening_cinema msc ON msc.cinema_id = c.cinema_id     `
    );

    const result = [];

    for (const row of rows as any[]) {
      // tìm cinema đã tồn tại trong result chưa
      let cinema = result.find((item) => item.cinema_id === row.cinema_id);

      // nếu chưa có thì tạo mới
      if (!cinema) {
        cinema = {
          cinema_id: row.cinema_id,
          name: row.name,
          specific_address: row.specific_address,
          ward: row.ward,
          province: row.province,
          price_base: row.price_base,
          status: row.status,
          time: [],
        };
        result.push(cinema);
      }

      // push time cho đúng cinema
      cinema.time.push({
        movie_screen_id: row.movie_screen_id,
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Error fetching cinemas" },
      { status: 500 }
    );
  }
}
