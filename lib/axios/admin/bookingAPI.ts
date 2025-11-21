// import { api } from "@/lib/axios";
import axiosInstance from "../config";

export async function getAllBookings() {
    try {
        const res = await axiosInstance.get(
            "/api/admin/booking/getAllBookings" // <-- QUAN TRỌNG
        );
        return res.data;
    } catch (err: any) {
        console.error("getAllBookings error:", err);
        throw err;
    }
}
