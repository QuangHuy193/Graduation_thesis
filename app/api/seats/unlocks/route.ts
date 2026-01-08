// app/api/seats/unlocks/route.js
import { unlockSeatAPI } from "@/lib/axios/seatsAPI";

export async function POST(req: Request) {
  const { seats, showtime_id } = await req.json();
  for (const seat of seats) {
    await unlockSeatAPI(seat, showtime_id);
  }

  return Response.json({
    success: true,
  });
}
