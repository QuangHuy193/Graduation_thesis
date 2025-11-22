// app/api/momo/create-payment/route.js
import crypto from "crypto";

export async function POST(req: any) {
    try {
        const body = await req.json();
        const { orderId, amount, orderInfo, returnUrl, notifyUrl, extraData = "" } = body;

        const partnerCode = process.env.MOMO_PARTNER_CODE;
        const accessKey = process.env.MOMO_ACCESS_KEY;
        const secretKey = process.env.MOMO_SECRET_KEY;
        const requestId = `${partnerCode}-${Date.now()}`;
        const requestType = "captureWallet"; // wallet flow. Thay đổi nếu cần.
        const endpoint = process.env.MOMO_ENV === "prod"
            ? "https://payment.momo.vn/v2/gateway/api/create"
            : "https://test-payment.momo.vn/v2/gateway/api/create";

        // Build raw signature theo thứ tự mà MoMo yêu cầu
        const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${notifyUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${returnUrl}&requestId=${requestId}&requestType=${requestType}`;

        const signature = crypto.createHmac("sha256", secretKey).update(rawSignature).digest("hex");

        const reqBody = {
            partnerCode,
            accessKey,
            requestId,
            amount: String(amount),
            orderId,
            orderInfo,
            redirectUrl: returnUrl,
            ipnUrl: notifyUrl,
            extraData,
            requestType,
            signature,
            lang: "vi"
        };

        const r = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(reqBody),
        });

        const json = await r.json();
        // Trả thẳng response của MoMo về frontend để frontend redirect bằng payUrl
        return new Response(JSON.stringify(json), { status: 200, headers: { "Content-Type": "application/json" } });
    } catch (error) {
        console.error("create-payment error:", error);
        return new Response(JSON.stringify({ error: "server_error" }), { status: 500, headers: { "Content-Type": "application/json" } });
    }
}
