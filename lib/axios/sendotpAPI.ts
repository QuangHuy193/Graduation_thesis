import axios from "axios";

export type SendOtpPayload = {
    email: string;
    name?: string;
    phone_number?: string;
    password?: string;
    birthday?: string;
    role?: "superadmin" | "admin" | "user";
};

export type SendOtpResponse = {
    success: boolean;
    message: string;
};

/**
 * Gửi OTP đến email người dùng (dùng cho cả đăng ký và xác minh).
 * @param data Dữ liệu người dùng (ít nhất cần email)
 * @returns Promise<SendOtpResponse>
 */
export async function sendOtp(data: SendOtpPayload): Promise<SendOtpResponse> {
    try {
        const response = await axios.post<SendOtpResponse>("/api/auth/send-otp", data, {
            headers: { "Content-Type": "application/json" },
            timeout: 10000, // 10s
        });

        return response.data;
    } catch (error: any) {
        if (axios.isAxiosError(error)) {
            return (
                error.response?.data ?? {
                    success: false,
                    message: "Không thể kết nối đến máy chủ.",
                }
            );
        }
        return { success: false, message: "Đã xảy ra lỗi không xác định." };
    }
}
