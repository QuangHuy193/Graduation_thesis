import axiosInstance from "../config";

export const getAllRooms = async () => {
    try {
        const res = await axiosInstance.get("/api/admin/rooms/getAllRooms"); // đường dẫn trỏ đến route GET bạn đã tạo
        return res.data;
    } catch (err) {
        return null;
    }
};
export const getCinemaFromRoom = async (room_id: number) => {
    try {
        const res = await axiosInstance.get(`/api/admin/rooms/getCinema/${room_id}`);
        return res.data;
    } catch (error) {
        return null;
    }
}
export async function getTotalSeats(room_id: number) {
    try {
        const res = await axiosInstance.get(`/api/admin/rooms/${room_id}/getTotalSeatByRoom`);
        return res.data;
    } catch (error) {
        throw error;
    }
}