import { redis } from "@/lib/redis"; // hoặc ioredis

export async function POST(req: Request) {
  try {
    const { seat_id } = await req.json();
    const key = `seat_lock_${seat_id}`;

    // Thử lock ghế trong 5 phút (300 giây)
    // NX: chỉ set nếu key chưa tồn tại
    // EX: tự động hết hạn sau 300 giây
    const lock = await redis.set(key, "locked", "EX", 300, "NX");

    if (!lock) {
      // Ghế đang bị giữ bởi ai đó
      return new Response(
        JSON.stringify({
          success: false,
          message: "Ghế đang được giữ",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Lock thành công
    return new Response(
      JSON.stringify({
        success: true,
        message: "Ghế đã được khóa 5 phút",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error(err);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Lỗi khi khóa ghế",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
