import axios from "axios";

export interface CheckStatusResponse {
    success: boolean;
    data?: {
        user_id: number;
        active: boolean;
    };
    message?: string;
    error?: string;
}

export async function checkUserStatus(userId: number): Promise<CheckStatusResponse> {
    try {
        const res = await axios.post<CheckStatusResponse>("/api/auth/checkActive", {
            user_id: userId,
        });

        return res.data;
    } catch (err: any) {
        return {
            success: false,
            error: err?.response?.data?.error || err.message || "Lỗi không xác định",
        };
    }
}
