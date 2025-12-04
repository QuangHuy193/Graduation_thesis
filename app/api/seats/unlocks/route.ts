// app/api/seats/unlocks/route.js
import { unlockSeatAPI } from "@/lib/axios/seatsAPI";

export async function POST(req: Request) {
  const { seats, showtime_id } = await req.json();
  console.log("unlocks", seats, showtime_id);
  for (const seat of seats) {
    console.log("for", seat, showtime_id);
    await unlockSeatAPI(seat, showtime_id);
  }

  return Response.json({
    success: true,
  });
}
