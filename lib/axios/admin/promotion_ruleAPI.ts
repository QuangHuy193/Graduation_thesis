import axiosInstance from "../config";

export async function checkIsHoliday(date: string) {
    const res = await axiosInstance.get(`/api/admin/promotion_rule/checkHoliday/${date}`);
    return res.data;
}
