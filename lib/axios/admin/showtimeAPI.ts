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

export async function commitShowtimeMoves(moves) {
    try {
        const res = await axiosInstance.post("/api/admin/showtime/move-batch", {
            moves: moves.map(m => ({
                showtime_id: m.showtime_id,
                to_room: m.to_room,
            }))
        });

        // API success
        return res.data;
    } catch (err: any) {
        // Axios throws on non-2xx status
        if (err.response) {
            console.error("API error:", err.response.data);
            throw err.response.data; // throw meaningful API error
        }
        throw err;
    }
}
