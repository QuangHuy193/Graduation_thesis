import axiosInstance from "../config";

export const getAllCinemas = async () => {
    try {
        const res = await axiosInstance.get("/api/admin/cinema/getAllCinemas");
        return res.data;
    } catch (err) {
        console.error("Error fetching cinemas:", err);
        return null;
    }
};
