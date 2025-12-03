// /api/seats/lock/route.ts
import redis from "@/lib/redis";

export async function POST(req: Request) {
  const { seat_id, showtime_id } = await req.json();
  const lockKey = `seat_lock_${seat_id}_${showtime_id}`;

  // EX: expire 300 giây (5 phút)
  // NX: chỉ tạo nếu key chưa tồn tại
  const result = await redis.set(lockKey, "locked", "EX", 300, "NX");

  if (result === "OK") {
    return Response.json({ success: true });
  } else {
    return Response.json({ success: false });
  }
}
