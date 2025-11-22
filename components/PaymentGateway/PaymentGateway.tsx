import React, { useState } from 'react';


//Import and use: <PaymentGateway onPay={(method, payload) => {}} />

const PAYMENT_METHODS = [
    { id: 'momo', label: 'Thanh toán qua Momo', subtitle: '', icon: '🟣' },
    { id: 'domestic_card', label: 'Thanh toán qua Thẻ nội địa', subtitle: '', icon: '💳' },
    { id: 'intl_card', label: 'Thanh toán qua thẻ quốc tế', subtitle: '', icon: '🌍' },
];

export default function PaymentGateway({
    initialMethod = 'momo',
    onPay = (method: any, payload: any) => console.log('pay', method, payload),
    onApplyCoupon = (code: any) => Promise.resolve({ ok: true, discount: 0 }),
}) {
    const [selected, setSelected] = useState(initialMethod);
    const [coupon, setCoupon] = useState('');
    const [couponMsg, setCouponMsg] = useState('Bạn đang có mã giảm giá');
    const [loadingCoupon, setLoadingCoupon] = useState(false);

    const handleApplyCoupon = async () => {
        if (!coupon) return setCouponMsg('Vui lòng nhập mã giảm giá');
        setLoadingCoupon(true);
        try {
            const res = await onApplyCoupon(coupon);
            if (res && res.ok) {
                setCouponMsg(`Áp dụng thành công - Giảm ${res.discount || 0}%`);
            } else {
                setCouponMsg('Mã không hợp lệ');
            }
        } catch (e) {
            setCouponMsg('Lỗi khi áp dụng mã');
        }
        setLoadingCoupon(false);
    };

    const handlePay = () => {
        onPay(selected, { coupon });
    };


    return (
        <div className="max-w-3xl mx-auto p-6">
            {/* Stepper header */}
            {/* <div className="flex items-center justify-between mb-6">
                <Step number={1} title="THÔNG TIN KHÁCH HÀNG" active={false} />
                <div className="flex-1 border-t border-dashed mx-2" />
                <Step number={2} title="THANH TOÁN" active={true} />
                <div className="flex-1 border-t border-dashed mx-2" />
                <Step number={3} title="THÔNG TIN VÉ PHIM" active={false} />
            </div> */}

            <div className="bg-linear-to-b from-[#0f1724] to-[#1f2340] rounded-lg p-6 text-white shadow-lg">
                {/* Payment options */}
                <div className="space-y-4">
                    {PAYMENT_METHODS.map((m) => (
                        <button
                            key={m.id}
                            onClick={() => setSelected(m.id)}
                            className={`w-full text-left border rounded-md p-4 flex items-center gap-4 transition-shadow focus:outline-none ${selected === m.id ? 'ring-2 ring-offset-2 ring-indigo-500 bg-white/5' : 'hover:shadow-md'
                                }`}
                        >
                            <div className="text-2xl bg-white/10 rounded-md w-12 h-12 flex items-center justify-center">{m.icon}</div>
                            <div className="flex-1">
                                <div className="font-semibold">{m.label}</div>
                                {m.subtitle && <div className="text-sm text-gray-300">{m.subtitle}</div>}
                            </div>
                            <div className="text-sm text-gray-300">
                                {selected === m.id ? 'Đã chọn' : 'Chọn'}
                            </div>
                        </button>
                    ))}
                </div>

                {/* Coupon block */}
                <div className="mt-6 p-4 bg-indigo-600 rounded-md">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 rounded flex items-center justify-center">🏷️</div>
                        <div className="flex-1">
                            <div className="font-semibold text-white">Chọn hoặc nhập mã giảm giá</div>
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
                            >
                                {loadingCoupon ? 'Đang...' : 'Áp dụng'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Preview / image - optional */}


                {/* Pay button */}
                <div className="mt-6 flex justify-end gap-3">
                    <button onClick={() => setSelected("")} className="px-4 py-2 rounded-md bg-transparent border text-white">
                        Quay lại
                    </button>
                    <button onClick={handlePay} className="px-6 py-2 rounded-md bg-indigo-500 font-semibold">
                        Thanh toán
                    </button>
                </div>
            </div>
        </div>
    );
}

function Step({ number, title, active }: any) {
    return (
        <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${active ? 'bg-yellow-400 text-black' : 'bg-gray-700 text-white'}`}>
                {number}
            </div>
            <div className={`text-xs ${active ? 'text-white' : 'text-gray-400'} hidden sm:block`}>{title}</div>
        </div>
    );
}
