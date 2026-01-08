// app/api/seats/unlock/route.js
import redis from "@/lib/redis";

export async function POST(req: Request) {
  const { seat_id, showtime_id } = await req.json();
  const key = `seat_lock_${seat_id}_${showtime_id}`;

  await redis.del(key);

  return Response.json({
    success: true,
  });
}
