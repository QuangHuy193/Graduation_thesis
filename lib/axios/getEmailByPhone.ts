import axios from "axios";

export interface GetEmailByPhoneResponse {
    success: boolean;
    message?: string;
    data?: {
        email: string;
    } | undefined;
}

/** Normalize phone: remove non-digits, convert +84... -> 0... if appropriate */
function normalizePhone(input: string) {
    if (!input) return input;
    const digits = input.replace(/\D/g, ""); // chỉ giữ số
    // Nếu dạng quốc tế bắt đầu bằng 84 (ví dụ 84901234567) -> chuyển về 0...
    if (digits.length >= 10 && digits.startsWith("84")) {
        return "0" + digits.slice(2);
    }
    // Nếu 9 chữ số (ví dụ 912345678) -> add leading 0
    if (digits.length === 9) {
        return "0" + digits;
    }
    return digits;
}

export async function getEmailByPhone(phone_number: string): Promise<GetEmailByPhoneResponse> {
    const normalized = normalizePhone(phone_number);

    try {
        const res = await axios.post<GetEmailByPhoneResponse>(
            "/api/auth/getEmailByPhone",
            { phone_number: normalized },
            { headers: { "Content-Type": "application/json" } }
        );

        // đảm bảo luôn trả đúng shape
        return res.data ?? { success: false, message: "Invalid response from server", data: undefined };
    } catch (err: any) {
        console.error("getEmailByPhone error:", err);
        return {
            success: false,
            message: err?.response?.data?.message || err?.message || "Lỗi server",
            data: undefined,
        };
    }
}
