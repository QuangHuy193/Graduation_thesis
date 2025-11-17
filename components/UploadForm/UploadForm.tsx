"use client";

import { useState, useEffect } from "react";
import styles from "./UploadForm.module.scss";
import FilmDatalist from "@/components/FlimDataList/FilmDatalist";
import { uploadToCloudinary } from "@/lib/axios/uploadCloudinaryAPI";
import { saveImageToDB } from "@/lib/axios/saveImageToDB";
import Button from "../Button/Button";

type Message = { type: "error" | "success"; text: string } | null;

type UploadedImage = {
    url: string | null;
    public_id?: string | null;
    caption?: string | null;
} | null;

export default function UploadForm() {
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [caption, setCaption] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);
    const [message, setMessage] = useState<Message>(null);
    const [uploaded, setUploaded] = useState<UploadedImage>(null);
    const [movieId, setMovieId] = useState<number | null>(null);
    const [progress, setProgress] = useState<number>(0);

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
        setProgress(0);

        try {
            // 1) Upload lên Cloudinary
            const cloudData = await uploadToCloudinary(file, {
                onUploadProgress: (p) => setProgress(p),
                // folder: 'movies' // nếu muốn
            });

            const url = cloudData.secure_url;
            const public_id = cloudData.public_id;

            // 2) Lưu vào DB bằng axios helper
            const savePayload = {
                url,
                public_id,
                movie_id: movieId ?? null,
                type: caption ? "gallery" : "poster",
            };

            const saveRes = await saveImageToDB(savePayload);

            // axios sẽ throw nếu HTTP 4xx/5xx, nhưng server có thể trả success: false
            if (!saveRes || !saveRes.success) {
                throw new Error((saveRes as any)?.error ?? "Save to DB failed");
            }

            setMessage({ type: "success", text: "Upload & lưu thành công!" });
            setUploaded({ url, public_id, caption });

            // reset form
            setFile(null);
            if (preview) URL.revokeObjectURL(preview);
            setPreview(null);
            setCaption("");
            setMovieId(null);
        } catch (err: any) {
            // axios error handling
            const text = err?.response?.data?.error ?? err?.message ?? String(err);
            setMessage({ type: "error", text });
        } finally {
            setLoading(false);
            setProgress(0);
        }
    }

    return (
        <div className={styles.container}>
            <h2 className={styles.title}>Upload ảnh</h2>

            <div style={{ marginBottom: 12 }}>
                <label className="block text-sm font-medium mb-1">Gán cho phim (tuỳ chọn)</label>
                <FilmDatalist
                    placeholder="Gõ tên phim..."
                    onSelect={(id) => {
                        setMovieId(id);
                    }}
                />
                <div className="text-xs text-gray-500 mt-1">Movie ID hiện tại: {movieId ?? "-"}</div>
            </div>

            <form onSubmit={handleSubmit}>
                <div className={styles.formGroup}>
                    {/* input ẩn, vẫn dùng onChange để set file */}
                    <input
                        id="upload-file"
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className={styles.inputFile}
                        aria-label="Chọn ảnh để upload"
                    />

                    {/* label sẽ hiện như button */}
                    <label htmlFor="upload-file" className={styles.fileButton} aria-hidden={loading}>
                        Chọn ảnh
                    </label>

                    {/* hiển thị tên file nếu đã chọn */}
                    <div className={styles.fileMeta}>
                        {file ? (
                            <span className={styles.fileName}>{file.name}</span>
                        ) : (
                            <span className={styles.noFile}>Chưa chọn file</span>
                        )}
                    </div>
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

                {progress > 0 && (
                    <div style={{ marginBottom: 8 }}>
                        <div style={{ height: 8, background: "#eee", borderRadius: 6, overflow: "hidden" }}>
                            <div style={{ width: `${progress}%`, height: "100%", background: "#06f" }} />
                        </div>
                        <div className="text-xs text-gray-500 mt-1">{progress}%</div>
                    </div>
                )}

                <Button type="submit" className={styles.button} disabled={loading}>
                    {loading ? "Đang upload..." : "Upload và Lưu"}
                </Button>
            </form>

            {message && <div className={`${styles.message} ${styles[message?.type ?? ""]}`}>{message.text}</div>}

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