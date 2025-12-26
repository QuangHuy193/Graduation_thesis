// lib/axios/admin/userAPI.ts
import axiosInstance from "../config";

export async function getAllUsers() {
    const res = await axiosInstance.get("/api/admin/user/getAllUser");
    return res.data.data;
}
export async function toggleUserStatus(id: number) {
    const res = await axiosInstance.patch(`/api/admin/user/${id}/toggleStatus`);
    if (res.data.success) {
        return res.data.data;
    }
};