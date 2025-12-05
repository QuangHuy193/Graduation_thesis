import axiosInstance from "../config";

export async function getScreenings() {
    try {
        const res = await axiosInstance.get("/api/admin/movie_screening/getAllScreen");
        return res.data.data || [];
    } catch (error) {
        console.error("Lỗi khi gọi API countries:", error);
        throw error;
    }
}
