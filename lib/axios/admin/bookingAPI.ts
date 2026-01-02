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
export async function refundBookingAgent(bookingId: number | string) {
    try {
        const res = await axiosInstance.post(
            `/api/admin/booking/${bookingId}/refundAgent`
        );

        return res.data;
    } catch (error: any) {
        const message =
            error?.response?.data?.message ||
            error?.response?.data?.error ||
            "Hoàn tiền thất bại";

        throw new Error(message);
    }
}