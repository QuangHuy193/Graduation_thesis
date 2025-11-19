// lib/api/signupFromOtp.ts

import axiosInstance from "../axios/config";
export type SignupFromOtpPayload = {
    otpId: number;
};


/**
 * Gọi API signup từ otpId (tạo user từ user_data đã lưu trong otps)
 * @param payload { otpId }
 * @returns Promise<SignupFromOtpResponse>
 */
export async function signupFromOtp(payload: SignupFromOtpPayload) {
    try {
        const res = await axiosInstance.post("/api/auth/signup", payload);
        return res.data;
    } catch (error: any) {
        // Nếu server trả JSON lỗi, trả về object đó; nếu network error thì trả fallback
        if (error?.isAxiosError) {
            return { success: false, message: "Không thể kết nối đến máy chủ." };
        }
        return { success: false, message: "Đã xảy ra lỗi không xác định." };
    }
}
