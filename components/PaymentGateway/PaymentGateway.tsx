import React, { useCallback, useEffect, useState } from "react";
import { createPayOSPayment } from "@/lib/axios/paymentAPI";
import { getVoucherByUserAPI } from "@/lib/axios/voucherAPI";
import { useSession } from "next-auth/react";
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
  // { id: "momo", label: "Thanh toán qua momo", subtitle: "", icon: "🟣" },
  {
    id: "domestic_card",
    label: "Thanh toán qua thẻ nội địa",
    subtitle: "",
    icon: "💳",
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
  onApplyCoupon?: (id: number) => Promise<ApplyCouponResult>;
};

export default function PaymentGateway({
  initialMethod = "domestic_card",
  amount,
  description = "Thanh toán đơn hàng",
  items = [],
  buyer,
  onPay = () => { },
  onApplyCoupon = async () => ({ ok: true, discount: 0 }),
}: PaymentGatewayProps) {
  const [selected, setSelected] = useState<PaymentMethodId | null>(
    initialMethod
  );
  // user
  const { data: session } = useSession();
  const user = session?.user;
  // danh sách voucher của user đang có
  const [couponListOption, setCouponListOption] = useState({
    couponList: [],
    couponDisplay: false,
  });
  // lưu id voucher
  const [coupon, setCoupon] = useState(-1);
  const [couponMsg, setCouponMsg] = useState("Bạn đang có mã giảm giá");
  const [loadingCoupon, setLoadingCoupon] = useState(false);

  const [loadingPay, setLoadingPay] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  useEffect(() => {
    const getCoupon = async (user_id) => {
      try {
        const res = await getVoucherByUserAPI(user_id);
        setCouponListOption((prev) => ({ ...prev, couponList: res }));
      } catch (error) {
        console.log(error);
      }
    };
    getCoupon(user.user_id);
  }, [user]);

  useEffect(() => {
    setSelected(initialMethod);
  }, [initialMethod]);

  const handleApplyCoupon = useCallback(async () => {
    if (!coupon || coupon === -1) {
      setCouponMsg("Vui lòng chọn mã giảm giá");
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
        await Promise.resolve(onPay(selected, { coupon, amount, items }));
        const orderCode = generateOrderCode();
        const result = await createPayOSPayment({
          orderCode,
          amount,
          description,
          items,
          coupon: coupon || undefined,
          returnUrl: `${window.location.origin}/checkout`,
          cancelUrl: `${window.location.origin}/checkout`,
          buyer: buyer || undefined,
        });

        if (result.ok && result.checkoutUrl) {
          window.location.href = result.checkoutUrl;
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
    try {
      setLoadingPay(true);
      await Promise.resolve(onPay(selected, { coupon, amount, items }));
    } catch (err: any) {
      setPayError(err?.message ?? "Lỗi khi xử lý thanh toán");
    } finally {
      setLoadingPay(false);
    }
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
                className={`w-full text-left border rounded-md p-4 flex items-center gap-4 transition-shadow focus:outline-none ${isSelected
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
        {/* khi bấm chọn sổ ra ds voucher */}
        <div className="bg-indigo-600 rounded-md">
          <div
            className="mt-6 p-4 rounded-md flex cursor-pointer
            hover:outline-2 hover:outline-indigo-500"
            onClick={() =>
              setCouponListOption((prev) => ({
                ...prev,
                couponDisplay: !prev.couponDisplay,
              }))
            }
          >
            <div className="flex-2">
              <div
                className="w-10 h-10 bg-white/20 rounded flex items-center 
              justify-center"
              >
                🏷️
              </div>
            </div>
            <div className="flex-10">
              <div className="font-semibold text-white">Chọn mã giảm giá</div>
              <div className="text-sm text-indigo-100">{couponMsg}</div>
            </div>
          </div>
          {/* ds voucher */}
          <div
            className={`transition-all duration-500 overflow-hidden ${couponListOption.couponDisplay
              ? "max-h-[600px] opacity-100"
              : "max-h-0 opacity-0"
              } bg-indigo-600/95 rounded-b-md shadow-inner`}
          >
            <div className="pt-3 px-4 pb-4 space-y-3 text-white">
              {/* map list */}
              {couponListOption.couponList &&
                couponListOption.couponList.map((c) => (
                  <div
                    key={c.voucher_id}
                    className="p-3 bg-white/10 rounded-md border border-white/10 
                       hover:bg-white/20 transition cursor-pointer"
                    onClick={() => setCoupon(c.voucher_id)}
                  >
                    <div className="font-semibold">{c.name}</div>
                    <div className="text-sm opacity-80">{c.description}</div>
                  </div>
                ))}

              <div className="flex justify-end">
                <button
                  onClick={handleApplyCoupon}
                  disabled={loadingCoupon}
                  className="px-3 py-2 bg-white/20 hover:bg-white/30 rounded-md 
                    text-white font-medium disabled:opacity-50 cursor-pointer"
                  type="button"
                >
                  {loadingCoupon ? "Đang..." : "Áp dụng"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* <div className="mt-6 p-4 bg-indigo-600 rounded-md flex">
          <div className="flex gap-3">
            <div>
              <div className="w-10 h-10 bg-white/20 rounded flex items-center justify-center">
                🏷️
              </div>
              <div className="font-semibold text-white">
                Chọn nhập mã giảm giá
              </div>
              <div className="flex-1">
                <div className="text-sm text-indigo-100">{couponMsg}</div>
              </div>
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
        </div> */}

        {payError && (
          <div className="mt-4 text-sm text-red-300">{payError}</div>
        )}

        {/* Pay button */}
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={handleReset}
            className="px-4 py-2 rounded-md bg-transparent border
             text-white cursor-pointer"
            type="button"
          >
            Quay lại
          </button>
          <button
            onClick={handlePay}
            className="px-6 py-2 rounded-md bg-indigo-500 font-semibold 
            disabled:opacity-50 flex items-center gap-2 cursor-pointer"
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
