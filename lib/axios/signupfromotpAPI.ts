// lib/api/signupFromOtp.ts
import { axiosClient } from "../axiosClient";

export type SignupFromOtpPayload = {
    otpId: number;
};

export type SignupFromOtpSuccess = {
    success: true;
    message: string;
    userId: number | null;
};

export type SignupFromOtpFail = {
    success: false;
    message: string;
};

export type SignupFromOtpResponse = SignupFromOtpSuccess | SignupFromOtpFail;

/**
 * Gọi API signup từ otpId (tạo user từ user_data đã lưu trong otps)
 * @param payload { otpId }
 * @returns Promise<SignupFromOtpResponse>
 */
export async function signupFromOtp(payload: SignupFromOtpPayload): Promise<SignupFromOtpResponse> {
    try {
        const res = await axiosClient.post<SignupFromOtpResponse>("/api/auth/signup", payload);
        return res.data;
    } catch (error: any) {
        // Nếu server trả JSON lỗi, trả về object đó; nếu network error thì trả fallback
        if (error?.isAxiosError) {
            const serverData = error.response?.data;
            if (serverData && typeof serverData === "object") {
                return serverData as SignupFromOtpFail;
            }
            return { success: false, message: "Không thể kết nối đến máy chủ." };
        }
        return { success: false, message: "Đã xảy ra lỗi không xác định." };
    }
}
