import axiosInstance from "../config";

export const getAllRooms = async () => {
    try {
        const res = await axiosInstance.get("/api/admin/rooms/getAllRooms"); // đường dẫn trỏ đến route GET bạn đã tạo
        return res.data;
    } catch (err) {
        console.error("Error fetching rooms:", err);
        return null;
    }
};
