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
export const addFood = async (foodData: any) => {
    try {
        const res: any = await axiosInstance.post(`/api/admin/foodbeverage/addFood`, foodData);
        if (res.success) {
            throw new Error(res.message || "Lỗi khi thêm món ăn");
        }
        return true;
    } catch (error) {
        throw error;
    }
}
export const deleteFood = async (id: number) => {
    try {
        const res: any = await axiosInstance.delete(`/api/admin/foodbeverage/${id}/delFood`);
        if (res.success) {
            throw new Error(res.message || "Lỗi khi xóa món ăn");
        }
        return true;
    } catch (error) {
        throw error;
    }
}
export const updateFood = async (id: string, foodData: any) => {
    try {
        const res: any = await axiosInstance.post(`/api/admin/foodbeverage/${id}/updateFood`, foodData);
        if (res.success) {
            throw new Error(res.message || "Lỗi khi cập nhật món ăn");
        }
        return true;
    } catch (error) {
        throw error;
    }
}