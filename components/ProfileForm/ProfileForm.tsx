"use client";

import React, { useState } from "react";
import styles from "./ProfileForm.module.scss";

/**
 * Props:
 *  - initialData: { fullName, dob, phone, email }
 *  - onSave: (data) => void
 */
export default function ProfileForm({ initialData = {}, onSave = (form: {
    fullName: any; dob: any; // yyyy-mm-dd
    phone: any; email: any;
}) => { } }) {
    const [form, setForm] = useState({
        fullName: initialData.fullName ?? "",
        dob: initialData.dob ?? "", // yyyy-mm-dd
        phone: initialData.phone ?? "",
        email: initialData.email ?? "",
    });

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    function handleChange(e: { target: { name: any; value: any; }; }) {
        const { name, value } = e.target;
        setForm((s) => ({ ...s, [name]: value }));
    }

    function validate() {
        if (!form.fullName.trim()) return "Họ và tên không được để trống.";
        if (!form.email.trim()) return "Email không được để trống.";
        // basic email check
        if (!/^\S+@\S+\.\S+$/.test(form.email)) return "Email không hợp lệ.";
        return "";
    }

    async function handleSave(e: { preventDefault: () => void; }) {
        e.preventDefault();
        setError("");
        const err = validate();
        if (err) {
            setError(err);
            return;
        }
        setSaving(true);
        try {
            // giả lập lưu, gọi callback
            await new Promise((res) => setTimeout(res, 600));
            onSave(form);
        } catch (err) {
            setError("Lưu thất bại. Vui lòng thử lại.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <form className={styles.form} onSubmit={handleSave} noValidate>
            <h2 className={styles.title}>Thông tin cá nhân</h2>

            <div className={styles.grid}>
                <label className={styles.field}>
                    <div className={styles.label}>Họ và tên</div>
                    <input
                        name="fullName"
                        value={form.fullName}
                        onChange={handleChange}
                        className={styles.input}
                        placeholder="Nhập họ và tên"
                        autoComplete="name"
                    />
                </label>

                <label className={styles.field}>
                    <div className={styles.label}>Ngày sinh</div>
                    <div className={styles.inputWrap}>
                        <input
                            type="date"
                            name="dob"
                            value={form.dob}
                            onChange={handleChange}
                            className={`${styles.input} ${styles.inputDate}`}
                        />
                        {/* optional calendar icon (pure SVG) */}
                        {/* <span className={styles.iconCalendar} aria-hidden>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" >
                                <path d="M7 11H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                <path d="M11 11H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                <path d="M7 15H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                <path d="M11 15H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.2" />
                                <path d="M16 2V6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                                <path d="M8 2V6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                            </svg>
                        </span> */}
                    </div>
                </label>

                <label className={styles.field}>
                    <div className={styles.label}>Số điện thoại</div>
                    <input
                        name="phone"
                        value={form.phone}
                        onChange={handleChange}
                        className={styles.input}
                        placeholder="Nhập số điện thoại"
                        inputMode="tel"
                        autoComplete="tel"
                    />
                </label>

                <label className={styles.field}>
                    <div className={styles.label}>Email</div>
                    <input
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        className={styles.input}
                        placeholder="you@example.com"
                        type="email"
                        autoComplete="email"
                    />
                </label>
            </div>

            {error && <div className={styles.error}>{error}</div>}

            <div className={styles.actions}>
                <button
                    type="submit"
                    className={styles.saveBtn}
                    disabled={saving}
                >
                    {saving ? "ĐANG LƯU..." : "LƯU THÔNG TIN"}
                </button>
            </div>
        </form>
    );
}
