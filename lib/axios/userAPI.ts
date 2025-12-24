import axiosInstance from "./config";

export async function getUserInfo(id: number) {
    try {
        const res = await axiosInstance.get(`/api/users/${id}`);
        return res.data.data[0];
    } catch (error: any) {
        console.error("Error fetching user:", error);
        throw error.response?.data || error;
    }
}
export async function updateUser(id: number, data: any) {
    try {
        const res = await axiosInstance.put(`/api/users/upd/${id}`, data);
        return res.data;
    } catch (error: any) {
        console.error("Error updating user:", error);
        throw error.response?.data || error;
    }
}


export async function changePassword(
    id: number | string,
    oldPassword: string,
    newPassword: string
) {
    try {
        const res = await axiosInstance.post(`/api/users/change-pass/${id}`, {
            oldPassword,
            newPassword,
        });

        return res.data; // trả về dữ liệu từ API
    } catch (error: any) {
        console.error("Error changing password:", error);
        throw error.response?.data || error;
    }
}


export async function forgotPassword(email: string) {
    try {
        const res = await axiosInstance.post("/api/users/forget-pass", {
            email,
        });

        return res.data;
    } catch (error: any) {
        console.error("Forgot password error:", error);
        throw error.response?.data || error;
    }
}
