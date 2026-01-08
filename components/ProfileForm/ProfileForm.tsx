"use client";

import React, { useState } from "react";
import styles from "./ProfileForm.module.scss";
import { updateUser } from "@/lib/axios/userAPI";
interface ProfileFormProps {
    id: number | string;
    initialData?: {
        name?: string;
        birthday?: string;   // yyyy-mm-dd
        phone?: string;
        email?: string;
    };
    onSave?: (data: {
        name: string;
        birthday: string;
        phone: string;
        email: string;
    }) => void;
}
export default function ProfileForm({ id, initialData = {}, onSave = () => { } }: ProfileFormProps) {
    const [form, setForm] = useState({
        name: initialData.name ?? "",
        birthday: initialData.birthday ?? "", // yyyy-mm-dd
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
        if (!form.name.trim()) return "Họ và tên không được để trống.";
        if (!form.phone.trim()) return "Số điện thoại không được để trống";
        // if (!form.email.trim()) return "Email không được để trống.";
        // // basic email check
        // if (!/^\S+@\S+\.\S+$/.test(form.email)) return "Email không hợp lệ.";
        return "";
    }

    async function handleSave(e: React.FormEvent) {
        e.preventDefault();
        setError("");

        const err = validate();
        if (err) {
            setError(err);
            return;
        }

        setSaving(true);
        const userId = Number(id);
        try {
            //  GỌI API UPDATE USER
            const response = await updateUser(userId, {
                name: form.name,
                birthday: form.birthday,
                phone: form.phone,
                // email: form.email,
            });

            // Nếu bạn muốn callback lên parent
            onSave?.(response);

        } catch (err: any) {
            console.error(err);
            setError("Cập nhật thất bại. Vui lòng thử lại.");
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
                        name="name"
                        value={form.name}
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
                            name="birthday"
                            value={form.birthday}
                            onChange={handleChange}
                            className={`${styles.input} ${styles.inputDate}`}
                        />

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
                    // disabled={true}
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
