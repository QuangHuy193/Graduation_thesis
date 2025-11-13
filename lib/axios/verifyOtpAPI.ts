// lib/api/verifyOtp.ts
import { axiosClient } from "../axiosClient";

export type VerifyOtpPayload = {
    email: string;
    otp: string;
};

export type VerifyOtpSuccess = {
    success: true;
    message: string;
    otpId: number; // theo response backend
};

export type VerifyOtpFail = {
    success: false;
    message: string;
    attempts?: number;
};

export type VerifyOtpResponse = VerifyOtpSuccess | VerifyOtpFail;

/**
 * Gọi API verify OTP
 * @param data { email, otp }
 * @returns Promise<VerifyOtpResponse>
 */
export async function verifyOtp(data: VerifyOtpPayload): Promise<VerifyOtpResponse> {
    try {
        const res = await axiosClient.post<VerifyOtpResponse>("/api/auth/verify-otp", data);
        return res.data;
    } catch (error: any) {
        // Axios error handling: trả về payload từ server nếu có, nếu không trả về object mặc định
        if (error?.isAxiosError) {
            const serverData = error.response?.data;
            if (serverData && typeof serverData === "object") {
                return serverData as VerifyOtpFail;
            }
            // network / timeout / no response
            return { success: false, message: "Không thể kết nối đến máy chủ. Vui lòng thử lại." };
        }
        return { success: false, message: "Đã xảy ra lỗi không xác định." };
    }
}
