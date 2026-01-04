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
// "@/lib/axios/admin/showtimeAPI.ts"


export type MovePayloadItem = {
    showtime_day_id?: number | null;
    showtime_id?: number | null;
    _temp_client_id?: number | null;
    show_date?: string | null;
    to_room?: number | null;
    to_movie_screen_id?: number | null;
    movie_id?: number | null;
    status?: string;
    screening_start?: string | null;
    screening_end?: string | null;
    movie_screen_id?: number | null;
};

export type CommitShowtimeResult = {
    ok: boolean;
    message?: string;
    results?: any[]; // server trả về các hàng đã update/insert
    [k: string]: any;
};

/**
 * Gửi batch moves tới API server.
 * - accepts array of MovePayloadItem OR object map (will normalized to array)
 * - throws error (axios error) nếu response.status không ok hoặc server trả lỗi
 */
export async function commitShowtimeMoves(moves: MovePayloadItem[] | Record<string, MovePayloadItem>) {
    const arr = Array.isArray(moves) ? moves : Object.values(moves ?? {});
    // nếu null/empty -> return early (giống logic cũ)
    if (!arr.length) {
        return { ok: true, message: "No moves", results: [] } as CommitShowtimeResult;
    }

    const payload = { moves: arr };

    try {
        // nếu bạn có axios instance với baseURL / interceptors, import và dùng thay vì axios trực tiếp
        const res = await axiosInstance.post<CommitShowtimeResult>("/api/admin/showtime/move-batch", payload);

        // axios resolves non-2xx as throw; res.data expected to have { ok, results, ... }
        return res.data;
    } catch (err: any) {
        // rethrow so caller can inspect err.response?.data like before
        throw err;
    }
}







export async function createShowtimeWithDay(payload: {
    movie_id: number;
    room_id: number;
    movie_screen_id: number;
    date: string;
    reuse_showtime?: boolean;
    _temp_client_id?: number;
}) {
    const res = await axiosInstance.post("/api/admin/showtime/createShowtimeAuto", payload);
    return res.data;
}
export async function createShowtimeBulk(payload: {
    from_date: string;
    to_date: string;
    items: Array<{
        movie_id: number;
        room_id: number;
        movie_screen_id: number;
    }>;
}) {
    try {
        const res = await axiosInstance.post(
            "/api/admin/showtime/createShowtimeBulkAuto",
            payload
        );
        return res.data;
    } catch (error) {
        throw error;
    }

}
export async function getAvailableSeats(showtime_id: number) {
    try {
        const res = await axiosInstance.get(`/api/admin/showtime/${showtime_id}/getAvailableSeatByShowtime`);
        return res.data;
    } catch (error) {
        throw error;
    }
}