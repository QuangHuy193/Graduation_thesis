// /api/seats/lock/refresh/route.ts
import redis from "@/lib/redis";
export async function POST(req: Request) {
  const { seat_id, showtime_id } = await req.json();
  const lockKey = `seat_lock_${seat_id}_${showtime_id}`;

  // Reset TTL về 300 giây
  const result = await redis.expire(lockKey, 300);

  if (result === 1) {
    return Response.json({ success: true });
  } else {
    return Response.json({ success: false, message: "Key không tồn tại" });
  }
}
