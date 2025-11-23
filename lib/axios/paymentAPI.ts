// /lib/paymentApi.ts
import axiosInstance from "./config";

export async function createPayOSPayment(data: {
    orderCode: number;
    amount: number;
    description: string;
    items?: Array<{ name: string; quantity: number; price: number }>;
    coupon?: string;
    buyer?: { name?: string; email?: string; phone?: string };
    returnUrl: string;
    cancelUrl: string;
}) {
    try {
        const res = await axiosInstance.post("/api/payos/create-payment", data);

        return res.data; // { ok: true, checkoutUrl } hoặc { ok:false, error }
    } catch (err: any) {
        return (
            err?.response?.data ?? {
                ok: false,
                error: err?.message ?? "Unknown error",
            }
        );
    }
}
