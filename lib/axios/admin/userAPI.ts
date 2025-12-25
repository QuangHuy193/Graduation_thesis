// lib/axios/admin/userAPI.ts
import axiosInstance from "../config";

export async function getAllUsers() {
    const res = await axiosInstance.get("/api/admin/user/getAllUser");
    return res.data.data;
}
