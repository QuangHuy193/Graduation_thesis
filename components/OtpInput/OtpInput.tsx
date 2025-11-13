"use client";

import { useEffect, useRef } from "react";
import styles from "./OtpInput.module.scss";

interface OtpInputProps {
    otp: string;
    setOtp: (value: string) => void;
    loading?: boolean;
    onEnter?: () => void;
}

export default function OtpInput({ otp, setOtp, loading, onEnter }: OtpInputProps) {
    const inputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const handleChange = (value: string) => {
        const sanitized = value.replace(/\D/g, "").slice(0, 6);
        setOtp(sanitized);
    };

    const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && onEnter) {
            e.preventDefault();
            onEnter();
        }
    };

    return (
        <input
            ref={inputRef}
            value={otp}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={onKeyDown}
            maxLength={6}
            inputMode="numeric"
            placeholder="Nhập mã 6 chữ số"
            aria-label="Mã OTP 6 chữ số"
            disabled={loading}
            autoComplete="one-time-code"
            className={`${styles.form_input} w-full`}
        />
    );
}
