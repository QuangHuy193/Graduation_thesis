import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

const PAYOS_API_BASE = "https://api-merchant.payos.vn";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const orderCode = searchParams.get("orderCode");

        if (!orderCode) {
            return NextResponse.json(
                { ok: false, error: "orderCode is required" },
                { status: 400 }
            );
        }

        // Gọi PayOS để lấy thông tin hóa đơn
        const payosRes = await axios.get(
            `${PAYOS_API_BASE}/v2/payment-requests/${orderCode}`,
            {
                headers: {
                    "x-client-id": process.env.PAYOS_CLIENT_ID!,
                    "x-api-key": process.env.PAYOS_API_KEY!,
                },
                timeout: 15000,
            }
        );

        // ⚠️ PAYOS bọc data bên trong field `data`
        const invoice = payosRes.data?.data;

        if (!invoice) {
            return NextResponse.json(
                { ok: false, error: "PayOS returned empty invoice" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            ok: true,
            invoice: {
                orderCode: invoice.orderCode,
                amount: invoice.amount,
                status: invoice.status,
                transactions: invoice.transactions ?? [],
                createdAt: invoice.createdAt,
            },
        });


        /**
         * data mẫu PayOS trả về:
         * {
         *   orderCode,
         *   amount,
         *   status: "PAID" | "PENDING" | "CANCELLED",
         *   transactions: [...],
         *   createdAt,
         * }
         */

        // return NextResponse.json({
        //     ok: true,
        //     invoice: {
        //         orderCode: data.orderCode,
        //         amount: data.amount,
        //         status: data.status,
        //         transactions: data.transactions,
        //         createdAt: data.createdAt,
        //     },
        // });
    } catch (err: any) {
        console.error("get invoice error", err?.response?.data || err);

        return NextResponse.json(
            {
                ok: false,
                error: err?.response?.data || "Cannot fetch invoice from PayOS",
            },
            { status: 500 }
        );
    }
}
