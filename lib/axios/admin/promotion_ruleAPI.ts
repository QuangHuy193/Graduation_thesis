import axiosInstance from "../config";

export async function checkIsHoliday(date: string) {
    const res = await axiosInstance.get(`/api/admin/promotion_rule/checkHoliday/${date}`);
    return res.data;
}
export async function getAllPromotions() {
    try {
        const res = await axiosInstance.get(
            "/api/admin/promotion_rule/getAllPromotion"
        );

        if (!res.data.success) {
            throw new Error("Fetch promotions failed");
        }

        return res.data.data;
    } catch (error: any) {
        console.error("getAllPromotions error:", error.response?.data || error);
        throw error;
    }
}
export async function togglePromotionEnable(id: number) {
    const res = await axiosInstance.patch(
        `/api/admin/promotion_rule/${id}/toggleEnable`
    );

    if (!res.data.success) {
        throw new Error("Toggle failed");
    }

    return res.data;
}