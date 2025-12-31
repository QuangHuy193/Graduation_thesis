import React, { useCallback, useEffect, useState } from "react";
import { createPayOSPayment } from "@/lib/axios/paymentAPI";
import { getVoucherByUserAPI } from "@/lib/axios/voucherAPI";
import { useSession } from "next-auth/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleCheck } from "@fortawesome/free-solid-svg-icons";
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
  setPriceDes: (price: number) => void;
  initialMethod?: PaymentMethodId;
  amount: number;
  description?: string;
  items?: Array<{ name: string; quantity: number; price: number }>;
  buyer?: { name?: string; email?: string; phone?: string };
  onPay?: (method: PaymentMethodId | null, payload: any) => void;
  onApplyCoupon?: (id: number) => Promise<ApplyCouponResult>;
};
type UserSession = {
  id?: number | string;
  name?: string;
  email?: string;
  role?: string;
  vip?: string;
  status?: string;
} | null;

export default function PaymentGateway({
  setPriceDes,
  initialMethod = "domestic_card",
  amount,
  description = "Thanh toán đơn hàng",
  items = [],
  buyer,
  onPay = () => {},
}: PaymentGatewayProps) {
  const [selected, setSelected] = useState<PaymentMethodId | null>(
    initialMethod
  );
  // giá có thể giảm
  const [priceFinal, setPriceFinal] = useState(amount);
  // user
  const { data: session } = useSession();
  const user = session?.user;
  let userSes: UserSession = null;

  if (typeof window !== "undefined") {
    const userStr = sessionStorage.getItem("user");
    userSes = userStr ? JSON.parse(userStr) : null;
  }

  // danh sách voucher của user đang có
  const [couponListOption, setCouponListOption] = useState({
    couponList: [],
    couponDisplay: false,
  });

  const [coupon, setCoupon] = useState({});
  // thông báo
  const [couponMsg, setCouponMsg] = useState("Bạn chưa có mã giảm giá nào.");
  const [loadingCoupon, setLoadingCoupon] = useState(false);

  const [loadingPay, setLoadingPay] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const currentUserId = user?.user_id
    ? Number(user.user_id)
    : userSes?.id
    ? Number(userSes.id)
    : null;

  // lấy ds voucher
  useEffect(() => {
    const getCoupon = async (user_id) => {
      try {
        const res = await getVoucherByUserAPI(user_id);
        if (res.length > 0) {
          setCouponMsg("Bạn đang có mã giảm giá");
        }
        setCouponListOption((prev) => ({ ...prev, couponList: res }));
      } catch (error) {
        console.log(error);
      }
    };
    getCoupon(currentUserId);
  }, [user, userSes]);

  useEffect(() => {
    setSelected(initialMethod);
  }, [initialMethod]);

  const handleApplyCoupon = async (coupon) => {
    // setLoadingCoupon(true);
    // setCouponMsg("Đang kiểm tra mã...");

    // áp dụng giảm
    let priceNew = amount;
    const couponValue = Math.abs(Number(coupon.value));
    if (coupon.rule_uniti === "percent") {
      const priceDes = (priceNew * couponValue) / 100;
      priceNew = priceNew - priceDes;
    } else {
      priceNew = priceNew - couponValue; // giảm tiền cố định
    }
    // set cho thanh toán
    setPriceFinal(priceNew);
    // set cho infobooking
    setPriceDes(priceNew);
  };

  const handleReset = useCallback(() => {
    setSelected(initialMethod);
    setCoupon({});
    setCouponMsg("");
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
        await Promise.resolve(onPay(selected, { coupon, priceFinal, items }));
        const orderCode = await generateOrderCode();
        console.log("qr", orderCode);
        console.log("priceFinal", priceFinal);
        const result = await createPayOSPayment({
          orderCode,
          amount: priceFinal,
          description,
          items,
          coupon: coupon || undefined,
          returnUrl: `${window.location.origin}/checkout`,
          cancelUrl: `${window.location.origin}/checkout`,
          buyer: buyer || undefined,
        });
        console.log("result", result);

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
    // try {
    //   setLoadingPay(true);
    //   await Promise.resolve(onPay(selected, { coupon, amount, items }));
    // } catch (err: any) {
    //   setPayError(err?.message ?? "Lỗi khi xử lý thanh toán");
    // } finally {
    //   setLoadingPay(false);
    // }
  }, [selected, coupon, priceFinal, description, items, onPay]);

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
            className={`transition-all duration-500 overflow-hidden ${
              couponListOption.couponDisplay
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
                       hover:bg-white/20 transition cursor-pointer relative"
                    onClick={() => {
                      if (coupon.voucher_id === c.voucher_id) {
                        setCoupon({});
                        handleApplyCoupon({});
                      } else {
                        setCoupon(c);
                        handleApplyCoupon(c);
                      }
                    }}
                  >
                    <div className="font-semibold">{c.name}</div>
                    <div className="text-sm opacity-80">{c.description}</div>
                    {coupon.voucher_id === c.voucher_id && (
                      <div
                        className="absolute top-1/2 right-2 -translate-y-1/2 
                     text-emerald-400"
                      >
                        <FontAwesomeIcon icon={faCircleCheck} />
                      </div>
                    )}
                  </div>
                ))}
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
