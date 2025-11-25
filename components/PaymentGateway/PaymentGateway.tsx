import React, { useCallback, useEffect, useState } from "react";
import { createPayOSPayment } from "@/lib/axios/paymentAPI";
/**
 * Usage:
 * <PaymentGateway
 *   initialMethod="payos"
 *   amount={120000}                 // bắt buộc để tạo order
 *   description="Thanh toán CineGo"
 *   items={[{ name: "Vé 2D", quantity: 2, price: 60000 }]}
 *   onApplyCoupon={async (code) => ({ ok: true, discount: 10 })}
 * />
 *
 * Lưu ý: server-side API /api/create-payment phải tồn tại và trả { ok: true, checkoutUrl }
 */

const PAYMENT_METHODS = [
  { id: "momo", label: "Thanh toán qua momo", subtitle: "", icon: "🟣" },
  {
    id: "domestic_card",
    label: "Thanh toán qua thẻ nội địa",
    subtitle: "",
    icon: "💳",
  },
  {
    id: "intl_card",
    label: "Thanh toán qua thẻ quốc tế",
    subtitle: "",
    icon: "🌍",
  },
] as const;

type PaymentMethodId = (typeof PAYMENT_METHODS)[number]["id"];

type ApplyCouponResult = { ok: boolean; discount?: number; message?: string };

type PaymentGatewayProps = {
  initialMethod?: PaymentMethodId;
  amount: number;
  description?: string;
  items?: Array<{ name: string; quantity: number; price: number }>;
  buyer?: { name?: string; email?: string; phone?: string };
  onPay?: (method: PaymentMethodId | null, payload: any) => void;
  onApplyCoupon?: (code: string) => Promise<ApplyCouponResult>;
};

export default function PaymentGateway({
  initialMethod = "domestic_card",
  amount,
  description = "Thanh toán đơn hàng",
  items = [],
  buyer,
  onPay = () => {},
  onApplyCoupon = async () => ({ ok: true, discount: 0 }),
}: PaymentGatewayProps) {
  const [selected, setSelected] = useState<PaymentMethodId | null>(
    initialMethod
  );
  const [coupon, setCoupon] = useState("");
  const [couponMsg, setCouponMsg] = useState("Bạn đang có mã giảm giá");
  const [loadingCoupon, setLoadingCoupon] = useState(false);

  const [loadingPay, setLoadingPay] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  useEffect(() => {
    setSelected(initialMethod);
  }, [initialMethod]);

  const handleApplyCoupon = useCallback(async () => {
    if (!coupon || coupon.trim() === "") {
      setCouponMsg("Vui lòng nhập mã giảm giá");
      return;
    }
    setLoadingCoupon(true);
    setCouponMsg("Đang kiểm tra mã...");
    try {
      const res = await onApplyCoupon(coupon.trim());
      if (res && res.ok) {
        setCouponMsg(`Áp dụng thành công - Giảm ${res.discount || 0}%`);
      } else {
        setCouponMsg(res?.message ?? "Mã không hợp lệ");
      }
    } catch (e) {
      setCouponMsg("Lỗi khi áp dụng mã");
    } finally {
      setLoadingCoupon(false);
    }
  }, [coupon, onApplyCoupon]);

  const handleReset = useCallback(() => {
    setSelected(initialMethod);
    setCoupon("");
    setCouponMsg("Bạn đang có mã giảm giá");
    setPayError(null);
  }, [initialMethod]);

  // Hàm tạo orderCode an toàn (number)
  function generateOrderCode(): number {
    // dùng timestamp + 3 random digits, đảm bảo <= Number.MAX_SAFE_INTEGER
    const base = Date.now(); // ms timestamp
    const suffix = Math.floor(Math.random() * 900) + 100; // 100..999
    const codeStr = `${base}${suffix}`.slice(0, 15); // cắt để an toàn
    return Number(codeStr);
  }

  const handlePay = useCallback(async () => {
    setPayError(null);

    if (!selected) {
      setPayError("Vui lòng chọn phương thức thanh toán");
      return;
    }

    // Nếu phương thức là payos -> gọi API server tạo checkout link
    if (selected === "domestic_card") {
      setLoadingPay(true);
      try {
        const orderCode = generateOrderCode();
        const result = await createPayOSPayment({
          orderCode,
          amount,
          description,
          items,
          coupon: coupon || undefined,
          returnUrl: `${window.location.origin}/payment-success?order=${orderCode}`,
          cancelUrl: `${window.location.origin}/payment-cancel?order=${orderCode}`,
          buyer: buyer || undefined,
        });

        if (result.ok && result.checkoutUrl) {
          window.location.href = result.checkoutUrl; // redirect sang payOS
          return;
        }

        setPayError(result.error ?? "Không tạo được link thanh toán");
      } catch (e: any) {
        setPayError(e?.message ?? "Lỗi khi gọi API tạo link thanh toán");
      } finally {
        setLoadingPay(false);
      }
      return;
    }

    // Các phương thức khác: theo callback onPay (legacy)
    onPay(selected, { coupon, amount, items });
  }, [selected, coupon, amount, description, items, onPay]);

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="bg-linear-to-b from-[#0f1724] to-[#1f2340] rounded-lg p-6 text-white shadow-lg">
        {/* Payment options */}
        <div className="space-y-4">
          {PAYMENT_METHODS.map((m) => {
            const isSelected = selected === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setSelected(m.id)}
                aria-pressed={isSelected}
                aria-label={m.label}
                className={`w-full text-left border rounded-md p-4 flex items-center gap-4 transition-shadow focus:outline-none ${
                  isSelected
                    ? "ring-2 ring-offset-2 ring-indigo-500 bg-white/5"
                    : "hover:shadow-md"
                }`}
                type="button"
              >
                <div className="text-2xl bg-white/10 rounded-md w-12 h-12 flex items-center justify-center">
                  {m.icon}
                </div>
                <div className="flex-1">
                  <div className="font-semibold">{m.label}</div>
                  {m.subtitle && (
                    <div className="text-sm text-gray-300">{m.subtitle}</div>
                  )}
                </div>
                <div className="text-sm text-gray-300">
                  {isSelected ? "Đã chọn" : "Chọn"}
                </div>
              </button>
            );
          })}
        </div>

        {/* Coupon block */}
        <div className="mt-6 p-4 bg-indigo-600 rounded-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded flex items-center justify-center">
              🏷️
            </div>
            <div className="flex-1">
              <div className="font-semibold text-white">
                Chọn hoặc nhập mã giảm giá
              </div>
              <div className="text-sm text-indigo-100">{couponMsg}</div>
            </div>
            <div className="flex gap-2">
              <input
                aria-label="Mã giảm giá"
                value={coupon}
                onChange={(e) => setCoupon(e.target.value)}
                className="px-3 py-2 rounded-md bg-white/10 placeholder-indigo-200 focus:outline-none"
                placeholder="Nhập mã"
              />
              <button
                onClick={handleApplyCoupon}
                disabled={loadingCoupon}
                className="px-3 py-2 bg-white/20 rounded-md text-white font-medium disabled:opacity-50"
                type="button"
              >
                {loadingCoupon ? "Đang..." : "Áp dụng"}
              </button>
            </div>
          </div>
        </div>

        {payError && (
          <div className="mt-4 text-sm text-red-300">{payError}</div>
        )}

        {/* Pay button */}
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={handleReset}
            className="px-4 py-2 rounded-md bg-transparent border text-white"
            type="button"
          >
            Quay lại
          </button>
          <button
            onClick={handlePay}
            className="px-6 py-2 rounded-md bg-indigo-500 font-semibold disabled:opacity-50 flex items-center gap-2"
            disabled={loadingPay}
            type="button"
            aria-disabled={loadingPay}
          >
            {loadingPay
              ? "Chuyển tới cổng thanh toán..."
              : `Thanh toán ${selected === "momo" ? "qua Momo" : ""}`}
          </button>
        </div>
      </div>
    </div>
  );
}
