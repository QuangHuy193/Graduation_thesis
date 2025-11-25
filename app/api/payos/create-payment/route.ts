// app/api/create-payment/route.ts
import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const PayOSModule = (() => {
    try {
        return require("@payos/node");
    } catch (e) {
        return null;
    }
})();
function safeCopy(obj: any) {
    const copy = JSON.parse(JSON.stringify(obj));
    // nếu có trường nhạy cảm, xóa ở đây:
    delete copy.apiKey;
    delete copy.checksumKey;
    return copy;
}
/**
 * Try multiple strategies to obtain an object that exposes `paymentRequests.create`.
 * Based on your debug, @payos/node exports keys: PayOS, PaymentRequests, Webhooks, ...
 */
function buildPayosLikeInstance(): any {
    if (!PayOSModule) return null;

    // 1) If there's a PayOS export that is constructable/class
    if (typeof PayOSModule.PayOS === "function") {
        try {
            // try as class
            const inst = new PayOSModule.PayOS({
                clientId: process.env.PAYOS_CLIENT_ID,
                apiKey: process.env.PAYOS_API_KEY,
                checksumKey: process.env.PAYOS_CHECKSUM_KEY,
            });
            if (inst && inst.paymentRequests) return inst;
        } catch (e) {
            // ignore and continue
        }

        try {
            // try as factory function
            const inst = PayOSModule.PayOS({
                clientId: process.env.PAYOS_CLIENT_ID,
                apiKey: process.env.PAYOS_API_KEY,
                checksumKey: process.env.PAYOS_CHECKSUM_KEY,
            });
            if (inst && inst.paymentRequests) return inst;
        } catch (e) {
            // continue
        }
    }

    // 2) If PaymentRequests itself is a class you can instantiate directly
    if (typeof PayOSModule.PaymentRequests === "function") {
        try {
            // some SDKs expect new PaymentRequests(clientConfig)
            const pr = new PayOSModule.PaymentRequests({
                clientId: process.env.PAYOS_CLIENT_ID,
                apiKey: process.env.PAYOS_API_KEY,
                checksumKey: process.env.PAYOS_CHECKSUM_KEY,
            });
            if (pr && typeof pr.create === "function") return { paymentRequests: pr };
        } catch (e) {
            // try static create on PaymentRequests
            try {
                if (typeof PayOSModule.PaymentRequests.create === "function") {
                    return { paymentRequests: PayOSModule.PaymentRequests };
                }
            } catch {
                // continue
            }
        }
    }

    // 3) If top-level object already has paymentRequests property with create()
    if (PayOSModule.paymentRequests && typeof PayOSModule.paymentRequests.create === "function") {
        return PayOSModule;
    }

    // 4) If default exists and contains useful bits
    if (PayOSModule.default) {
        const D = PayOSModule.default;
        if (typeof D === "function") {
            try {
                const inst = new D({
                    clientId: process.env.PAYOS_CLIENT_ID,
                    apiKey: process.env.PAYOS_API_KEY,
                    checksumKey: process.env.PAYOS_CHECKSUM_KEY,
                });
                if (inst && inst.paymentRequests) return inst;
            } catch { }
            try {
                const inst = D({
                    clientId: process.env.PAYOS_CLIENT_ID,
                    apiKey: process.env.PAYOS_API_KEY,
                    checksumKey: process.env.PAYOS_CHECKSUM_KEY,
                });
                if (inst && inst.paymentRequests) return inst;
            } catch { }
        }
        if (D.paymentRequests && typeof D.paymentRequests.create === "function") {
            return D;
        }
        if (typeof D.PaymentRequests === "function") {
            try {
                const pr = new D.PaymentRequests({
                    clientId: process.env.PAYOS_CLIENT_ID,
                    apiKey: process.env.PAYOS_API_KEY,
                    checksumKey: process.env.PAYOS_CHECKSUM_KEY,
                });
                if (pr && typeof pr.create === "function") return { paymentRequests: pr };
            } catch { }
        }
    }

    // no known shape matched — return module so we can debug further outside
    return PayOSModule;
}

async function callOrderService(orderServiceBase: string, body: any) {
    const url = `${orderServiceBase.replace(/\/$/, "")}/order/create`;
    const res = await axios.post(url, body, {
        headers: { "Content-Type": "application/json" },
        timeout: 15000,
    });
    return res.data;
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        const { orderCode, amount } = body ?? {};

        if (!orderCode || !amount) {
            return NextResponse.json({ ok: false, error: "orderCode & amount required" }, { status: 400 });
        }

        // If you have an order service (payOS example uses one), prefer proxying to it:
        const ORDER_SERVICE_BASE = process.env.ORDER_SERVICE_BASE_URL || process.env.REACT_APP_ORDER_URL || null;
        if (ORDER_SERVICE_BASE) {
            try {
                const data = await callOrderService(ORDER_SERVICE_BASE, body);
                return NextResponse.json(data);
            } catch (err: any) {
                console.error("call order service failed:", err?.message ?? err);
                // fallthrough to SDK attempts
            }
        }

        // Try to build an instance / wrapper that exposes paymentRequests.create
        const payosLike = buildPayosLikeInstance();

        // If payosLike has paymentRequests.create, use it
        if (payosLike && payosLike.paymentRequests && typeof payosLike.paymentRequests.create === "function") {
            const result = await payosLike.paymentRequests.create({
                orderCode: body.orderCode,
                amount: body.amount,
                description: body.description,
                items: body.items,
                returnUrl: body.returnUrl,
                cancelUrl: body.cancelUrl,
            });
            return NextResponse.json({ ok: true, checkoutUrl: result?.checkoutUrl ?? null });
        }

        // If PaymentRequests class itself had static create
        if (PayOSModule && typeof PayOSModule.PaymentRequests === "object" && typeof (PayOSModule.PaymentRequests as any).create === "function") {
            const result = await (PayOSModule.PaymentRequests as any).create({
                orderCode: body.orderCode,
                amount: body.amount,
                description: body.description,
                items: body.items,
                returnUrl: body.returnUrl,
                cancelUrl: body.cancelUrl,
                clientId: process.env.PAYOS_CLIENT_ID,
                apiKey: process.env.PAYOS_API_KEY,
                checksumKey: process.env.PAYOS_CHECKSUM_KEY,
            });
            return NextResponse.json({ ok: true, checkoutUrl: result?.checkoutUrl ?? null });
        }

        // Nothing matched — return helpful debug info
        const debugInfo: any = {
            havePayosModule: !!PayOSModule,
            topLevelType: typeof PayOSModule,
        };

        if (PayOSModule) {
            try {
                debugInfo.topLevelKeys = Object.keys(PayOSModule);
            } catch {
                debugInfo.topLevelKeys = "[cannot enumerate]";
            }
            if (PayOSModule.default) {
                try {
                    debugInfo.defaultKeys = Object.keys(PayOSModule.default);
                } catch {
                    debugInfo.defaultKeys = "[cannot enumerate]";
                }
            }
        }

        return NextResponse.json(
            {
                ok: false,
                error: "Cannot find create() entrypoint on payos SDK instance.",
                debug: debugInfo,
                hint: "Based on SDK exports, try new PayOSModule.PayOS(...) or new PayOSModule.PaymentRequests(...). If unsure, paste debug info here.",
            },
            { status: 500 }
        );
    } catch (err: any) {
        console.error("create-payment error", err);
        const message = err?.response?.data ?? err?.message ?? String(err);
        return NextResponse.json({ ok: false, error: message }, { status: 500 });
    }
}
