// app/api/payout-mock/route.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { payouts } = body;

        if (!payouts?.length) {
            return NextResponse.json(
                { ok: false, error: "payouts required" },
                { status: 400 }
            );
        }

        // Giả lập xử lý 1–2 giây (cho giống API thật)
        await new Promise((res) => setTimeout(res, 1200));

        // Fake batchId
        const batchId = "mock_batch_" + Date.now();

        // Trả về danh sách payout đã được "thực thi"
        const result = payouts.map((p: any) => ({
            payoutId: "mock_payout_" + Math.random().toString(36).slice(2),
            referenceId: p.referenceId,
            toAccount: p.toAccount,
            toBankCode: p.toBankCode,
            toName: p.toName,
            amount: p.amount,
            description: p.description ?? null,
            status: "COMPLETED", // mô phỏng thành công
            completedAt: new Date().toISOString()
        }));

        return NextResponse.json({
            ok: true,
            data: {
                batchId,
                status: "SUCCESS",
                total: result.length,
                payouts: result
            }
        });
    } catch (err: any) {
        console.error("payout-mock error", err);
        return NextResponse.json(
            { ok: false, error: err?.message ?? String(err) },
            { status: 500 }
        );
    }
}
