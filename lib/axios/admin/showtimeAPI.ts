// lib/axios/admin/showtimeAPI.ts
import axiosInstance from "../config";

export async function getAllShowtimes() {
    try {
        const res = await axiosInstance.get("/api/admin/showtime/getAllShowtime");

        return res.data?.data?.data ?? [];
    } catch (err: any) {
        console.error("getAllShowtimes error:", err);
        throw err;
    }
}
export async function getAllShowtimeDay() {
    try {
        const res = await axiosInstance.get("/api/admin/showtime_days/getAllDay");

        return res.data.data ?? [];
    } catch (err: any) {
        console.error("getAllShowtimes error:", err);
        throw err;
    }
}
export async function commitShowtimeMoves(moves) {
    // Normalize: accept array or object map
    const arr = Array.isArray(moves) ? moves : (moves && typeof moves === "object" ? Object.values(moves) : []);

    if (!arr.length) {
        return { ok: true, message: "No moves" };
    }

    // build payload (chỉ include các trường backend cần)
    const payload = {
        moves: arr.map(m => ({
            showtime_id: m.showtime_id ?? null,
            to_room: m.to_room ?? null,
            // nếu backend cần to_movie_screen_id / movie_id, thêm vào đây
            ...(m.to_movie_screen_id !== undefined ? { to_movie_screen_id: m.to_movie_screen_id } : {}),
            ...(m.movie_id !== undefined ? { movie_id: m.movie_id } : {}),
            ...(m._temp_client_id !== undefined ? { _temp_client_id: m._temp_client_id } : {}),
        }))
    };

    try {
        const res = await axiosInstance.post("/api/admin/showtime/move-batch", payload);
        return res.data;
    } catch (err) {
        if (err?.response) {
            console.error("API error:", err.response.data);
            throw err.response.data;
        }
        throw err;
    }
}


// lib/api/showtimeDays.ts


export async function getShowtimeDays(from: string, to: string) {
    const url = `/api/admin/showtime/getRangeShowtime?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;

    const res = await axiosInstance.get(url);
    // API đang trả dạng { success, message, data: { data: [], total }, status }
    // nên bạn lấy res.data.data.data để ra mảng showtime_day
    return res.data.data.data;
}
// lib/axios/admin/showtimeAPI.ts (append)


export async function createShowtimeWithDay(payload: {
    movie_id: number;
    room_id: number;
    movie_screen_id: number;
    show_date: string;
    start_date?: string;
    end_date?: string;
    reuse_showtime?: boolean;
    _temp_client_id?: number;
}) {
    const res = await axiosInstance.post("/api/admin/showtime/createShowtimeAuto", payload);
    return res.data;
}
