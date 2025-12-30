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


export async function triggerRefund() {
    try {
        const resp = await axiosInstance.post(`/api/payos/payout-mock`,
            {
                payouts: [
                    {
                        referenceId: "refund_001",
                        toAccount: "0123456789",
                        toBankCode: "970436",
                        toName: "Nguyen Van A",
                        amount: 50000,
                        description: "Refund order #123"
                    }
                ]
            }
        );

        return resp.data;
    } catch (err: any) {
        console.error("refund error:", err.response?.data || err.message);
        throw err;
    }
}

export interface RefundPayload {
    referenceId: string;
    amount: number;
    description: string;
    orderCode: string;
    // toBin: string;
    // toAccountNumber: string;
}

export async function refundPayOS(payload: RefundPayload) {
    try {
        const resp = await axiosInstance.post("/api/payos/payout", payload, {
            headers: {
                "Content-Type": "application/json"
            }
        });

        return resp.data;
    } catch (err: any) {
        console.error("Refund PayOS error:", err.response?.data || err.message);
        throw err.response?.data || err;
    }
}
export async function updatePaymentOrderCode(payload: {
    booking_id: number;
    order_code: string | number;
}) {
    const res = await axiosInstance.post(
        "/api/payment/addOrderCode",
        payload
    );
    return res.data;
}