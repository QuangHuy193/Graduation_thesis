// app/payment-success/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

/**
 * Payment success page (client)
 *
 * - expects query ?order=<orderCode>
 * - will call GET /api/get-order?order=<orderCode> (adjust URL if your API differs)
 * - will poll every 5s until status becomes 'paid'/'failed' or until attempts exhausted
 *
 * Make sure your server exposes an endpoint to return order status:
 *  GET /api/get-order?order=12345
 * returns JSON like:
 * { ok: true, data: { orderCode: 12345, amount: 120000, status: "pending"|"paid"|"failed", buyer: {name,email,phone}, checkoutUrl, message } }
 *
 * If your server path is different, change `fetchOrder()` below accordingly.
 */

export default function PaymentSuccessPage() {
    const search = useSearchParams();
    const router = useRouter();
    const orderParam = search?.get("order") ?? "";
    const orderCode = orderParam ? orderParam : null;

    const [loading, setLoading] = useState(false);
    const [order, setOrder] = useState<any | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [attempts, setAttempts] = useState(0);
    const MAX_POLL = 12; // poll up to 12 times (5s * 12 = 60s)

    const humanStatus = useMemo(() => {
        if (!order) return "Đang kiểm tra...";
        const st = String(order.status || "").toLowerCase();
        if (st === "paid" || st === "success" || order.paid === true) return "Thành công";
        if (st === "failed" || st === "cancel" || st === "canceled") return "Thất bại";
        return "Đang chờ";
    }, [order]);

    useEffect(() => {
        if (!orderCode) {
            setError("Không tìm thấy mã đơn (order).");
            return;
        }

        let mounted = true;
        let timer: any = null;

        async function fetchOrder() {
            setLoading(true);
            setError(null);
            try {
                const res = await fetch(`/api/get-order?order=${encodeURIComponent(orderCode)}`, {
                    method: "GET",
                    headers: { "Content-Type": "application/json" },
                });
                const data = await res.json();
                if (!mounted) return;

                if (!res.ok) {
                    setError((data && data.error) || `Lỗi server (${res.status})`);
                    setLoading(false);
                    return;
                }

                if (!data?.ok) {
                    setError(data?.error ?? "Không lấy được thông tin đơn");
                    setLoading(false);
                    return;
                }

                setOrder(data.data ?? null);
                setLoading(false);

                const st = String((data.data?.status ?? "").toLowerCase());
                if (!(st === "paid" || st === "success" || data.data?.paid === true) && attempts < MAX_POLL) {
                    // schedule next poll
                    timer = setTimeout(() => {
                        setAttempts((a) => a + 1);
                        fetchOrder();
                    }, 5000);
                }
            } catch (err: any) {
                if (!mounted) return;
                setError(err?.message ?? "Lỗi khi gọi API");
                setLoading(false);
            }
        }

        fetchOrder();

        return () => {
            mounted = false;
            if (timer) clearTimeout(timer);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [orderCode, attempts]);

    function formatMoney(v?: number | string | null) {
        if (v == null) return "-";
        const n = typeof v === "number" ? v : Number(v);
        if (Number.isNaN(n)) return String(v);
        return n.toLocaleString("vi-VN") + " VND";
    }

    function renderDetails() {
        if (!order) return null;
        const d = order;
        return (
            <div className="mt-4 text-sm text-slate-700 space-y-2">
                <div>
                    <strong>Mã đơn:</strong> {d.orderCode ?? d.order_code ?? orderCode}
                </div>
                <div>
                    <strong>Số tiền:</strong> {formatMoney(d.amount ?? d.total ?? d.paymentAmount)}
                </div>
                {d?.buyer && (
                    <div>
                        <strong>Người mua:</strong> {d.buyer.name ?? "-"} {d.buyer.phone ? `• ${d.buyer.phone}` : ""}{" "}
                        {d.buyer.email ? `• ${d.buyer.email}` : ""}
                    </div>
                )}
                {d?.transactionId && (
                    <div>
                        <strong>Mã giao dịch:</strong> {d.transactionId}
                    </div>
                )}
                {d?.message && (
                    <div>
                        <strong>Ghi chú:</strong> {d.message}
                    </div>
                )}
                <div>
                    <strong>Trạng thái:</strong> {humanStatus}
                </div>
            </div>
        );
    }

    return (
        <div
            className="min-h-screen flex items-start justify-center py-16 px-6 bg-[linear-gradient(180deg,var(--color-blue-black)_0%,#2b3b5e_100%)] text-black"
        >
            <div className="w-full max-w-2xl bg-white rounded-lg shadow p-8">
                <h1 className="text-2xl font-semibold">Kết quả thanh toán</h1>

                {!orderCode && (
                    <div className="mt-6 text-red-600">
                        Không tìm thấy mã đơn trong URL. Vui lòng kiểm tra tham số ?order=ORDER_CODE
                    </div>
                )}

                {orderCode && (
                    <>
                        <div className="mt-4">
                            {loading ? (
                                <div className="flex items-center gap-3">
                                    <div className="w-6 h-6 border-2 border-dashed rounded-full animate-spin border-slate-400" />
                                    <div>Đang kiểm tra trạng thái đơn...</div>
                                </div>
                            ) : error ? (
                                <div className="text-red-600">{error}</div>
                            ) : (
                                <div>
                                    {order && (String(order.status).toLowerCase() === "paid" || order.paid === true) ? (
                                        <div className="p-4 rounded border border-green-200 bg-green-50">
                                            <div className="text-green-700 font-semibold">Thanh toán thành công 🎉</div>
                                            <div className="text-sm text-green-700">Cảm ơn bạn — đơn hàng đã được xác nhận.</div>
                                        </div>
                                    ) : (
                                        <div className="p-4 rounded border border-yellow-200 bg-yellow-50">
                                            <div className="text-yellow-800 font-semibold">Thanh toán đang chờ xác nhận</div>
                                            <div className="text-sm text-yellow-800">
                                                Hệ thống sẽ cập nhật trạng thái tự động khi nhận được phản hồi từ cổng thanh toán.
                                            </div>
                                            <div className="mt-2 text-xs text-slate-500">Trang sẽ làm mới trạng thái tự động (tối đa ~1 phút).</div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {renderDetails()}

                        <div className="mt-6 flex gap-3">
                            <Link href="/" className="px-4 py-2 rounded bg-gray-100 border">
                                Về trang chủ
                            </Link>

                            {order && order.checkoutUrl && (
                                <a href={order.checkoutUrl} target="_blank" rel="noreferrer" className="px-4 py-2 rounded bg-indigo-600 text-white">
                                    Mở lại trang thanh toán
                                </a>
                            )}

                            <button
                                onClick={() => {
                                    // force refresh status
                                    setAttempts(0);
                                    setOrder(null);
                                }}
                                className="px-4 py-2 rounded border bg-white"
                            >
                                Kiểm tra lại
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
