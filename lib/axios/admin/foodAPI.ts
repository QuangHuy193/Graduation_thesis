import axiosInstance from "../config";
export const getAllFoods = async () => {
    try {
        const res: any = await axiosInstance.get(`/api/admin/foodbeverage/getAllFoodbeverage`);
        if (res.success) {
            throw new Error(res.message || "Lỗi khi lấy danh sách món ăn");
        }
        return res.data.data;
    } catch (error) {
        throw error;
    }
}
