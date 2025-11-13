"use client";

import React, { useEffect, useRef, useState } from "react";
import { verifyOtp } from "@/lib/axios/verifyOtpAPI";
import { sendOtp } from "@/lib/axios/sendotpAPI";
import { useSearchParams, useRouter } from "next/navigation";
import Button from "@/components/Button/Button";
import OtpInput from "@/components/OtpInput/OtpInput";
import styles from "./page.module.scss";

export default function VerifyOtpPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const email = searchParams.get("email") ?? "";

    const [otp, setOtp] = useState("");
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState<{ type: "error" | "success"; text: string } | null>(null);
    const RESEND_COOLDOWN = 30;
    const [cooldown, setCooldown] = useState<number>(0);

    const inputRef = useRef<HTMLInputElement | null>(null);
    useEffect(() => { inputRef.current?.focus(); }, []);

    useEffect(() => {
        if (cooldown <= 0) return;
        const t = window.setTimeout(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
        return () => clearTimeout(t);
    }, [cooldown]);

    const handleVerify = async () => {
        setMsg(null);
        if (!email) { setMsg({ type: "error", text: "Không có email để xác thực — quay lại trang đăng ký." }); return; }
        if (!/^\d{6}$/.test(otp)) { setMsg({ type: "error", text: "Vui lòng nhập mã 6 chữ số hợp lệ." }); return; }

        setLoading(true);
        try {
            const data = await verifyOtp({ email, otp });
            if (data?.success) {
                setMsg({ type: "success", text: data.message || "Xác thực OTP thành công." });
                setTimeout(() => router.replace("/login"), 600);
                return;
            }
            const attemptsMsg = (data as any)?.attempts ? ` Số lần thử: ${(data as any).attempts}.` : "";
            setMsg({ type: "error", text: (data as any)?.message || "OTP không hợp lệ." + attemptsMsg });
        } catch (err: any) {
            console.error("verifyOtp error:", err);
            setMsg({ type: "error", text: err?.message || "Lỗi khi xác thực OTP. Vui lòng thử lại." });
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (!email) { setMsg({ type: "error", text: "Không có email để gửi mã. Vui lòng quay lại đăng ký." }); return; }
        if (cooldown > 0) return;

        setLoading(true);
        setMsg(null);
        try {
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

    useEffect(() => {
        if (otp.length === 6 && !loading) handleVerify();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [otp]);

    return (
        <div className={styles.container}>
            <div className={styles.innerSpacer} />
            <div className="w-full max-w-md mx-auto">
                <div className={styles.card}>
                    <h2 className={styles.title}>Xác thực mã OTP</h2>
                    <p className={styles.subtitle}>Nhập mã 6 chữ số đã được gửi đến email của bạn để hoàn tất đăng ký.</p>

                    {email ? (
                        <div className="mb-4 text-sm">Email: <strong className="text-slate-800">{email}</strong></div>
                    ) : (
                        <div className="mb-4 text-sm text-red-600">Không có email để xác thực. Vui lòng quay lại trang đăng ký.</div>
                    )}

                    <label htmlFor="otp" className="sr-only">Mã OTP 6 chữ số</label>
                    <OtpInput otp={otp} setOtp={setOtp} loading={loading} onEnter={handleVerify} />

                    <div className={styles.rowBtns}>
                        <Button
                            onClick={handleVerify}
                            disabled={loading || !email || otp.length !== 6}
                            className="px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60"
                            type="button"
                        >
                            {loading ? "Đang xác thực..." : "Xác thực"}
                        </Button>

                        <button
                            onClick={handleResend}
                            disabled={loading || !email || cooldown > 0}
                            className={styles.resendBtn}
                            type="button"
                        >
                            {cooldown > 0 ? `Gửi lại sau ${cooldown}s` : "Gửi lại mã"}
                        </button>

                        <button
                            onClick={() => router.push("/register")}
                            className={styles.backBtn}
                            type="button"
                        >
                            Quay lại đăng ký
                        </button>
                    </div>

                    {msg && <div className={msg.type === "error" ? styles.msgError : styles.msgSuccess}>{msg.text}</div>}

                    <div className={styles.hint}>Mã có hiệu lực trong 5 phút. Nếu không nhận được email, kiểm tra thư mục spam hoặc thử gửi lại.</div>
                </div>
            </div>
        </div>
    );
}
