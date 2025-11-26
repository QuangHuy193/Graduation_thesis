"use client";

import React, { useState } from "react";
import styles from "./PasswordForm.module.scss";

export default function PasswordForm({ onSave = async (data: any) => { } }) {
    const [form, setForm] = useState({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
    });
    const [error, setError] = useState("");
    const [fieldErrors, setFieldErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [show, setShow] = useState({
        old: false,
        new: false,
        confirm: false,
    });

    function handleChange(e: { target: { name: any; value: any; }; }) {
        const { name, value } = e.target;
        setForm((s) => ({ ...s, [name]: value }));
        // clear field error on change
        setFieldErrors((fe) => ({ ...fe, [name]: "" }));
    }

    function validate() {
        const fe = {};
        if (!form.oldPassword.trim()) fe.oldPassword = "Vui lòng nhập mật khẩu cũ.";
        if (!form.newPassword.trim()) fe.newPassword = "Vui lòng nhập mật khẩu mới.";
        if (!form.confirmPassword.trim()) fe.confirmPassword = "Vui lòng xác nhận mật khẩu.";
        // simple rule: new !== old
        if (form.newPassword && form.oldPassword && form.newPassword === form.oldPassword) {
            fe.newPassword = "Mật khẩu mới không được trùng mật khẩu cũ.";
        }
        if (form.newPassword && form.confirmPassword && form.newPassword !== form.confirmPassword) {
            fe.confirmPassword = "Mật khẩu xác nhận không khớp.";
        }
        return fe;
    }

    async function handleSubmit(e: { preventDefault: () => void; }) {
        e.preventDefault();
        setError("");
        const fe = validate();
        if (Object.keys(fe).length) {
            setFieldErrors(fe);
            return;
        }

        setLoading(true);
        try {
            // call parent handler (you can call API here)
            await onSave({
                oldPassword: form.oldPassword,
                newPassword: form.newPassword,
            });
            // reset
            setForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
            setFieldErrors({});
        } catch (err) {
            setError(err?.message || "Lấy thay đổi mật khẩu thất bại.");
        } finally {
            setLoading(false);
        }
    }

    function toggle(which: string) {
        setShow((s) => ({ ...s, [which]: !s[which] }));
    }

    return (
        <form className={styles.form} onSubmit={handleSubmit} noValidate>
            <h2 className={styles.title}>Đổi mật khẩu</h2>

            <div className={styles.field}>
                <label className={styles.label} htmlFor="oldPassword">
                    Mật khẩu cũ <span className={styles.required}>*</span>
                </label>
                <div className={styles.inputWrap}>
                    <input
                        id="oldPassword"
                        name="oldPassword"
                        type={show.old ? "text" : "password"}
                        value={form.oldPassword}
                        onChange={handleChange}
                        className={`${styles.input} ${fieldErrors.oldPassword ? styles.inputError : ""}`}
                        placeholder=""
                        autoComplete="current-password"
                    />
                    <button
                        type="button"
                        aria-label="Hiện/ẩn mật khẩu cũ"
                        className={styles.eyeBtn}
                        onClick={() => toggle("old")}
                    >
                        {show.old ? "🙈" : "👁️"}
                    </button>
                </div>
                {fieldErrors.oldPassword && <div className={styles.fieldError}>{fieldErrors.oldPassword}</div>}
            </div>

            <div className={styles.field}>
                <label className={styles.label} htmlFor="newPassword">
                    Mật khẩu mới <span className={styles.required}>*</span>
                </label>
                <div className={styles.inputWrap}>
                    <input
                        id="newPassword"
                        name="newPassword"
                        type={show.new ? "text" : "password"}
                        value={form.newPassword}
                        onChange={handleChange}
                        className={`${styles.input} ${fieldErrors.newPassword ? styles.inputError : ""}`}
                        placeholder=""
                        autoComplete="new-password"
                    />
                    <button
                        type="button"
                        aria-label="Hiện/ẩn mật khẩu mới"
                        className={styles.eyeBtn}
                        onClick={() => toggle("new")}
                    >
                        {show.new ? "🙈" : "👁️"}
                    </button>
                </div>
                {fieldErrors.newPassword && <div className={styles.fieldError}>{fieldErrors.newPassword}</div>}
            </div>

            <div className={styles.field}>
                <label className={styles.label} htmlFor="confirmPassword">
                    Xác thực mật khẩu <span className={styles.required}>*</span>
                </label>
                <div className={styles.inputWrap}>
                    <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={show.confirm ? "text" : "password"}
                        value={form.confirmPassword}
                        onChange={handleChange}
                        className={`${styles.input} ${fieldErrors.confirmPassword ? styles.inputError : ""}`}
                        placeholder=""
                        autoComplete="new-password"
                    />
                    <button
                        type="button"
                        aria-label="Hiện/ẩn mật khẩu xác thực"
                        className={styles.eyeBtn}
                        onClick={() => toggle("confirm")}
                    >
                        {show.confirm ? "🙈" : "👁️"}
                    </button>
                </div>
                {fieldErrors.confirmPassword && <div className={styles.fieldError}>{fieldErrors.confirmPassword}</div>}
            </div>

            {error && <div className={styles.formError}>{error}</div>}

            <div className={styles.actions}>
                <button type="submit" className={styles.saveBtn} disabled={loading}>
                    {loading ? "ĐANG LƯU..." : "ĐỔI MẬT KHẨU"}
                </button>
            </div>
        </form>
    );
}
