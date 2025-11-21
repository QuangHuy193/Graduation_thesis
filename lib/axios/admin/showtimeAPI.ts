// lib/axios/admin/showtimeAPI.ts
import axiosInstance from "../config";

export async function getAllShowtimes() {
    try {
        const res = await axiosInstance.get("/api/admin/showtime/getAllShowtime");

        // API trả successResponse => data nằm trong res.data.data
        return res.data?.data || [];
    } catch (err: any) {
        console.error("getAllShowtimes error:", err);
        throw err;
    }
}
