import { NextResponse } from "next/server";
export const runtime = "nodejs";
import { generatePayOSSignature } from "@/lib/function";

export async function POST(req: Request) {
    try {
        const body = await req.json();

        const payload = {
            referenceId: body.referenceId,
            amount: Number(body.amount),
            description: body.description,
            toBin: body.toBin,
            toAccountNumber: body.toAccountNumber,
            // category: ["refund"]
        };

        const signature = generatePayOSSignature(
            payload,
            process.env.PAYOS_REFUND_CHECKSUM_KEY!
        );
        console.log("Signature ", signature);

        const ipCheck = await fetch("https://api.ipify.org?format=json");
        console.log("OUTGOING IP:", await ipCheck.json());
        const resp = await fetch("https://api-merchant.payos.vn/v1/payouts", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": process.env.PAYOS_REFUND_API_KEY!,
                "x-client-id": process.env.PAYOS_REFUND_CLIENT_ID!,
                "x-idempotency-key": payload.referenceId,
                "x-signature": signature
            },
            body: JSON.stringify(payload) // body vẫn là JSON
        });


        const result = await resp.json();

        //     // 👉 lưu DB
        //     await db.query(
        //         `INSERT INTO payout 
        //    (reference_id, amount, to_account, to_bin, description, payos_response)
        //    VALUES (?,?,?,?,?,?)`,
        //         [
        //             payload.referenceId,
        //             payload.amount,
        //             payload.toAccountNumber,
        //             payload.toBin,
        //             payload.description,
        //             JSON.stringify(result)
        //         ]
        //     );

        return NextResponse.json({ success: true, data: result });

    } catch (err) {
        console.error("PAYOUT ERROR:", err);
        return NextResponse.json(
            { success: false, message: "Payout failed" },
            { status: 500 }
        );
    }
}