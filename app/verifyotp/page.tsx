"use client";

import React, { useEffect, useRef, useState } from "react";
import { verifyOtp } from "@/lib/axios/verifyOtpAPI";
import { sendOtp } from "@/lib/axios/sendotpAPI";
import { useSearchParams, useRouter } from "next/navigation";
import Button from "@/components/Button/Button";
export default function VerifyOtp() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const email = searchParams.get("email") ?? "";

    const [otp, setOtp] = useState("");
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState<{ type: "error" | "success"; text: string } | null>(null);

    // resend cooldown (seconds)
    const RESEND_COOLDOWN = 30;
    const [cooldown, setCooldown] = useState<number>(0);
    const cooldownRef = useRef<number | null>(null);

    // input ref để focus
    const inputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    useEffect(() => {
        if (cooldown > 0) {
            cooldownRef.current = window.setInterval(() => {
                setCooldown((c) => {
                    if (c <= 1 && cooldownRef.current) {
                        window.clearInterval(cooldownRef.current);
                        cooldownRef.current = null;
                        return 0;
                    }
                    return c - 1;
                });
            }, 1000);
            return () => {
                if (cooldownRef.current) {
                    window.clearInterval(cooldownRef.current);
                    cooldownRef.current = null;
                }
            };
        }
        return;
    }, [cooldown]);

    // Safe JSON parse for non-json responses
    async function safeJson(res: Response) {
        const ct = res.headers.get("content-type") ?? "";
        if (ct.includes("application/json")) {
            try {
                return await res.json();
            } catch {
                return null;
            }
        }
        return null;
    }

    const handleVerify = async () => {
        setMsg(null);
        if (!email) {
            setMsg({ type: "error", text: "Không có email để xác thực — quay lại trang đăng ký." });
            return;
        }
        if (!/^\d{6}$/.test(otp)) {
            setMsg({ type: "error", text: "Vui lòng nhập mã 6 chữ số hợp lệ." });
            return;
        }

        setLoading(true);
        try {
            // gọi axios wrapper
            const data = await verifyOtp({ email, otp });

            if (data.success) {
                setMsg({ type: "success", text: data.message || "Xác thực OTP thành công." });

                const otpId = (data as any).otpId;
                if (!otpId) {
                    setMsg({ type: "error", text: "Không tìm thấy mã OTP hợp lệ để đăng ký." });
                    return;
                }

                // chuyển về login sau khi hiện message thành công (600ms)
                setTimeout(() => {
                    // replace để không cho user back về trang OTP
                    router.replace("/login");
                }, 600);

                return;
            }

            // Nếu success === false (VerifyOtpFail)
            const attemptsMsg = (data as any).attempts ? ` Số lần thử: ${(data as any).attempts}.` : "";
            setMsg({ type: "error", text: data.message || ("OTP không hợp lệ." + attemptsMsg) });
        } catch (err: any) {
            // verifyOtp wrapper đã xử lý axios errors nhưng phòng thêm
            console.error("verifyOtp error:", err);
            const msgText = err?.message || "Lỗi khi xác thực OTP. Vui lòng thử lại.";
            setMsg({ type: "error", text: msgText });
        } finally {
            setLoading(false);
        }
    };

    // resend OTP (gọi send-otp với chỉ email — server của bạn hỗ trợ)
    const handleResend = async () => {
        if (!email) {
            setMsg({ type: "error", text: "Không có email để gửi mã. Vui lòng quay lại đăng ký." });
            return;
        }
        if (cooldown > 0) return;

        setLoading(true);
        setMsg(null);
        try {
            // Gọi wrapper axios
            const data = await sendOtp({ email });

            if (data && data.success) {
                setMsg({ type: "success", text: "Mã OTP đã được gửi lại. Kiểm tra email." });
                setCooldown(RESEND_COOLDOWN);
            } else {
                setMsg({ type: "error", text: data?.message || "Không thể gửi lại OTP." });
            }
        } catch (err: any) {
            console.error("Resend OTP error:", err);
            setMsg({ type: "error", text: err?.message || "Lỗi khi gửi lại OTP." });
        } finally {
            setLoading(false);
        }
    };


    const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleVerify();
        }
    };

    return (
        <div
            className="pl-32 pr-32 text-black pb-20
      bg-[linear-gradient(180deg,var(--color-blue-black)_0%,#2b3b5e_100%)] min-h-screen flex items-center"
        >
            <div className="h-[var(--width-header)]" />

            <div className="w-full max-w-md mx-auto">
                <div className="bg-white/95 rounded-xl shadow-lg p-6">
                    <h2 className="text-2xl font-semibold mb-3 text-slate-800">Xác thực mã OTP</h2>
                    <p className="text-sm text-slate-600 mb-4">
                        Nhập mã 6 chữ số đã được gửi đến email của bạn để hoàn tất đăng ký.
                    </p>

                    {/* Hiển thị email (nếu có) */}
                    {email ? (
                        <div className="mb-4 text-sm">
                            Email: <strong className="text-slate-800">{email}</strong>
                        </div>
                    ) : (
                        <div className="mb-4 text-sm text-red-600">
                            Không có email để xác thực. Vui lòng quay lại trang đăng ký.
                        </div>
                    )}

                    {/* OTP input */}
                    <input
                        ref={inputRef}
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        onKeyDown={onKeyDown}
                        maxLength={6}
                        inputMode="numeric"
                        placeholder="Nhập mã 6 chữ số"
                        aria-label="Mã OTP 6 chữ số"
                        className="form_input w-full mb-3 px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        disabled={loading}
                    />

                    {/* Buttons */}
                    <div className="flex gap-3 items-center">
                        <Button
                            onClick={handleVerify}
                            disabled={loading || !email}
                            className="px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60"
                            type="button"
                        >
                            {loading ? "Đang xác thực..." : "Xác thực"}
                        </Button>

                        <button
                            onClick={handleResend}
                            disabled={loading || !email || cooldown > 0}
                            className=" text-sm text-sky-600 disabled:opacity-50"
                            type="button"
                        >
                            {cooldown > 0 ? `Gửi lại sau ${cooldown}s` : "Gửi lại mã"}
                        </button>

                        <button
                            onClick={() => router.push("/register")}
                            className="ml-auto text-sm text-slate-600"
                            type="button"
                        >
                            Quay lại đăng ký
                        </button>
                    </div>

                    {/* Message */}
                    {msg && (
                        <div className={`mt-4 text-sm ${msg.type === "error" ? "text-red-600" : "text-green-700"}`}>
                            {msg.text}
                        </div>
                    )}

                    {/* small hint */}
                    <div className="mt-4 text-xs text-slate-500">
                        Mã có hiệu lực trong 5 phút. Nếu không nhận được email, kiểm tra thư mục spam hoặc thử gửi lại.
                    </div>
                </div>
            </div>
        </div>
    );
}