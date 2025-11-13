"use client";

import { useState, useEffect } from "react";
import styles from "./UploadForm.module.scss";

type Message = { type: "error" | "success"; text: string } | null;

type UploadedImage = {
    url: string | null;
    public_id?: string | null;
    caption?: string | null;
} | null;

type UploadApiResponse = {
    success?: boolean;
    insertId?: number | null;
    image?: { url: string; public_id: string; caption?: string | null };
    url?: string;
    error?: string;
    details?: string;
};

export default function UploadForm() {
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [caption, setCaption] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);
    const [message, setMessage] = useState<Message>(null);
    const [uploaded, setUploaded] = useState<UploadedImage>(null);

    useEffect(() => {
        return () => {
            if (preview) URL.revokeObjectURL(preview);
        };
    }, [preview]);

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const f = e.target.files?.[0] ?? null;
        setFile(f);
        setMessage(null);

        if (preview) URL.revokeObjectURL(preview);
        setPreview(f ? URL.createObjectURL(f) : null);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!file) {
            setMessage({ type: "error", text: "Chọn file trước khi upload." });
            return;
        }

        setLoading(true);
        setMessage(null);

        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("caption", caption);

            const res = await fetch("/api/cloudinary", { method: "POST", body: formData });
            const data: UploadApiResponse = await res.json().catch(() => ({} as UploadApiResponse));

            if (!res.ok) {
                setMessage({
                    type: "error",
                    text: data?.error || data?.details || "Upload thất bại",
                });
                return;
            }

            setMessage({ type: "success", text: "Upload & lưu thành công!" });
            setUploaded(data.image ?? { url: data.url ?? null, caption });

            setFile(null);
            if (preview) URL.revokeObjectURL(preview);
            setPreview(null);
            setCaption("");
        } catch (err) {
            setMessage({ type: "error", text: String(err) });
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className={styles.container}>
            <h2 className={styles.title}>Upload ảnh</h2>

            <form onSubmit={handleSubmit}>
                <div className={styles.formGroup}>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className={styles.inputFile}
                    />
                </div>

                {preview && (
                    <div className={styles.preview}>
                        <p>Preview:</p>
                        <img src={preview} alt="preview" />
                    </div>
                )}

                <div className={styles.formGroup}>
                    <input
                        type="text"
                        placeholder="Caption (tùy chọn)"
                        value={caption}
                        onChange={(e) => setCaption(e.target.value)}
                        className={styles.inputText}
                    />
                </div>

                <button type="submit" className={styles.button} disabled={loading}>
                    {loading ? "Đang upload..." : "Upload và Lưu"}
                </button>
            </form>

            {message && (
                <div className={`${styles.message} ${styles[message.type]}`}>
                    {message.text}
                </div>
            )}

            {uploaded && uploaded.url && (
                <div className={styles.uploaded}>
                    <p>Ảnh đã lưu:</p>
                    <a href={uploaded.url} target="_blank" rel="noreferrer">
                        <img src={uploaded.url} alt={uploaded.caption ?? ""} />
                    </a>
                    {uploaded.caption && <p>{uploaded.caption}</p>}
                </div>
            )}
        </div>
    );
}
