// lib/api/verifyOtp.ts
import axiosInstance from "./config";

export type VerifyOtpPayload = {
    email: string;
    otp: string;
};

// export type VerifyOtpSuccess = {
//     success: true;
//     message: string;
//     otpId: number; // theo response backend
// };

// export type VerifyOtpFail = {
//     success: false;
//     message: string;
//     attempts?: number;
// };

// export type VerifyOtpResponse = VerifyOtpSuccess | VerifyOtpFail;

/**
 * Gọi API verify OTP
 * @param data { email, otp }
 * @returns Promise<VerifyOtpResponse>
 */
export async function verifyOtp(data: VerifyOtpPayload) {
    try {
        const res = await axiosInstance.post("/api/auth/verify-otp", data);
        return res.data;
    } catch (error: any) {
        // Axios error handling: trả về payload từ server nếu có, nếu không trả về object mặc định
        if (error?.isAxiosError) {
            // network / timeout / no response
            return { success: false, message: "Otp đã hết hạn." };
        }
        return { success: false, message: "Đã xảy ra lỗi không xác định." };
    }
}
