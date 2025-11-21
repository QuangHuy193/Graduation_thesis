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
