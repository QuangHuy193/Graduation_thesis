"use client";

import { useState, useEffect, useRef } from "react";
import styles from "./UploadForm.module.scss";
import FilmDatalist from "@/components/FlimDataList/FilmDatalist";
import { uploadToCloudinary } from "@/lib/axios/uploadCloudinaryAPI";
import { saveImageToDB } from "@/lib/axios/saveImageToDB";
import Button from "../Button/Button";
import { useSearchParams } from "next/navigation";
import { MovieFullITF } from "@/lib/interface/movieInterface";
import { getMovieWithIdAPI } from "@/lib/axios/admin/movieAPI";

type Message = { type: "error" | "success"; text: string } | null;

type UploadedImage = {
    url: string | null;
    public_id?: string | null;
    caption?: string | null;
} | null;

export default function UploadForm() {
    const searchParams = useSearchParams();
    const movieIdParam = searchParams?.get("movieId") ?? null;

    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const prevPreviewRef = useRef<string | null>(null);
    const [caption, setCaption] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);
    const [message, setMessage] = useState<Message>(null);
    const [uploaded, setUploaded] = useState<UploadedImage>(null);
    const [movieId, setMovieId] = useState<number | null>(null);
    const [progress, setProgress] = useState<number>(0);
    const [movieInfo, setMovieInfo] = useState<MovieFullITF | null>(null);
    const [movieLoading, setMovieLoading] = useState(false);
    const [movieError, setMovieError] = useState<string | null>(null);
    // Thêm này ngay bên cạnh movieError

    useEffect(() => {
        if (!movieIdParam) return;
        const id = Number(movieIdParam);
        if (!id || Number.isNaN(id)) {
            setMovieError("movieId không hợp lệ trong URL");
            return;
        }
        setMovieId(id);
    }, [movieIdParam]);

    // revoke previous preview safely
    useEffect(() => {
        return () => {
            // on unmount, revoke any existing preview
            if (prevPreviewRef.current) {
                try {
                    URL.revokeObjectURL(prevPreviewRef.current);
                } catch { }
            }
        };
    }, []);

    // fetch movie by query param on mount / when param changes

    useEffect(() => {
        const id = movieIdParam ? Number(movieIdParam) : null;
        if (!id || Number.isNaN(id)) {
            if (movieIdParam) setMovieError("movieId không hợp lệ trong URL");
            return;
        }

        // use the shared fetch helper (normalize + set states)
        let cancelled = false;
        (async () => {
            try {
                // fetchMovieById already sets movieLoading / movieError / movieInfo
                const normalized = await fetchMovieById(id, { setCaptionFromName: true });
                if (cancelled) return;
                // nothing else needed — fetchMovieById already updated state
            } catch (err) {
                if (cancelled) return;
                // fetchMovieById handles errors/logging
            }
        })();

        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [movieIdParam]);

    // helper: normalize movie object returned from API
    function normalizeMovie(raw: any): MovieFullITF | null {
        if (!raw) return null;
        // If API returns array accidentally, take first
        const obj = Array.isArray(raw) ? raw[0] : raw;
        if (!obj) return null;
        // try to find an id field
        const id = Number(obj.movie_id ?? obj.id ?? obj.movieId ?? obj.id_movie ?? 0);
        if (!id || Number.isNaN(id)) return null;
        // build normalized object (keep other fields)
        return {
            ...obj,
            movie_id: id,
            name: obj.name ?? obj.title ?? obj.movie_name ?? "",
            image: obj.image ?? obj.poster ?? obj.image_url ?? obj.img ?? "",
            trailer_url: obj.trailer_url ?? obj.trailer ?? "",
            description: obj.description ?? obj.desc ?? "",
            release_date: obj.release_date ?? obj.date_add ?? obj.date ?? "",
            age_require: obj.age_require ?? obj.age ?? 0,
            country: obj.country ?? "",
            subtitle: obj.subtitle ?? "",
            duration: obj.duration ?? 0,
            status: obj.status ?? 1,
            genres: Array.isArray(obj.genres) ? obj.genres : (typeof obj.genres === "string" ? obj.genres.split(",").map((s: string) => s.trim()).filter(Boolean) : []),
            actors: Array.isArray(obj.actors) ? obj.actors : (typeof obj.actors === "string" ? obj.actors.split(",").map((s: string) => s.trim()).filter(Boolean) : []),
        } as MovieFullITF;
    }

    // single fetch helper (used by effects and by FilmDatalist selection)
    async function fetchMovieById(id: number | null, opts?: { setCaptionFromName?: boolean }) {
        if (id == null || !Number(id) || Number.isNaN(Number(id))) {
            setMovieInfo(null);
            setMovieError("ID phim không hợp lệ");
            return null;
        }
        setMovieLoading(true);
        setMovieError(null);
        try {
            const data = await getMovieWithIdAPI(Number(id));
            const normalized = normalizeMovie(data);
            if (!normalized) {
                setMovieInfo(null);
                setMovieError("Phim này chưa có hình");
                return null;
            }
            setMovieInfo(normalized);

            if (opts?.setCaptionFromName !== false) {
                setCaption(normalized.name ? `Poster - ${normalized.name}` : "");

            }

            setMovieError(null);
            // ensure state movieId matches fetched id
            setMovieId(Number(normalized.movie_id));
            return normalized;
        } catch (err: any) {
            console.error("Lỗi fetch movie:", err);
            const msg = err?.response?.data?.message ?? err?.message ?? "Lỗi khi lấy movie";
            setMovieInfo(null);
            setMovieError(msg);
            return null;
        } finally {
            setMovieLoading(false);
        }
    }

    // if movieId (from URL) changes, fetch movie info
    useEffect(() => {
        if (movieId == null) return;
        fetchMovieById(movieId, { setCaptionFromName: true });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [movieId]);

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const f = e.target.files?.[0] ?? null;
        setFile(f);
        setMessage(null);

        // revoke previous preview if any
        if (prevPreviewRef.current) {
            try {
                URL.revokeObjectURL(prevPreviewRef.current);
            } catch { }
            prevPreviewRef.current = null;
        }

        const newUrl = f ? URL.createObjectURL(f) : null;
        if (newUrl) prevPreviewRef.current = newUrl;
        setPreview(newUrl);
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
            // Accept both forms: uploadToCloudinary may call onUploadProgress with percent or event
            const cloudData = await uploadToCloudinary(file, {
                onUploadProgress: (pOrEv: any) => {
                    // if number -> percent already
                    if (typeof pOrEv === "number") {
                        setProgress(Math.max(0, Math.min(100, Math.round(pOrEv))));
                        return;
                    }
                    // if event -> compute percent
                    try {
                        const ev = pOrEv as ProgressEvent;
                        if (ev && ev.lengthComputable) {
                            const perc = Math.round((ev.loaded / ev.total) * 100);
                            setProgress(Math.max(0, Math.min(100, perc)));
                        }
                    } catch { }
                },
            });

            const url = (cloudData as any).secure_url;
            const public_id = (cloudData as any).public_id;

            // 2) Lưu vào DB bằng axios helper
            const savePayload = {
                url,
                public_id,
                movie_id: movieId ?? null,
                type: movieInfo?.image ? "gallery" : "poster",
                caption: caption || null,
            };

            const saveRes = await saveImageToDB(savePayload);

            if (!saveRes || !saveRes.success) {
                throw new Error((saveRes as any)?.error ?? "Save to DB failed");
            }

            setMessage({ type: "success", text: "Upload & lưu thành công!" });
            setUploaded({ url, public_id, caption });

            // reset file + preview (keep movieId so user can keep uploading for same movie)
            setFile(null);
            if (prevPreviewRef.current) {
                try {
                    URL.revokeObjectURL(prevPreviewRef.current);
                } catch { }
                prevPreviewRef.current = null;
            }
            setPreview(null);
            setCaption("");
        } catch (err: any) {
            const text = err?.response?.data?.error ?? err?.message ?? String(err);
            setMessage({ type: "error", text });
        } finally {
            setLoading(false);
            setProgress(0);
        }
    }

    // FilmDatalist select handler: use helper to fetch movie info (consistent)
    async function handleFilmSelect(id: number | null) {
        if (id == null) {
            setMovieId(null);
            setMovieInfo(null);
            setMovieError(null);
            return;
        }
        // avoid duplicate work if already showing this movie
        if (Number(id) === Number(movieId) && movieInfo) return;

        // fetchMovieById will set movieLoading, movieInfo, movieError and caption
        await fetchMovieById(Number(id), { setCaptionFromName: true });
    }


    return (
        <div className={styles.container}>
            <h2 className={styles.title}>Upload ảnh</h2>

            {/* nếu có movieId từ query -> show info */}
            {movieId != null ? (
                <div className={styles.movieInfo}>
                    {movieLoading ? (
                        <div className={styles.smallText}>Đang tải thông tin phim #{movieId}…</div>
                    ) : movieError ? (
                        <div className={styles.smallText} style={{ color: "red" }}>{movieError}</div>
                    ) : movieInfo ?
                        <div className={styles.movieCard}>
                            <div className={styles.moviePoster}>
                                {movieInfo.image ? (
                                    <img src={String(movieInfo.image)} alt={movieInfo.name ?? "poster"} />
                                ) : (
                                    <div className={styles.noPoster}>No poster</div>
                                )}
                            </div>
                            {/* rest of meta */}
                        </div>

                        : null}
                </div>
            ) : null}

            <div style={{ marginBottom: 12 }}>
                <label className="block text-sm font-medium mb-1">Gán cho phim (tuỳ chọn)</label>
                <FilmDatalist
                    placeholder="Gõ tên phim..."
                    initialId={movieInfo?.movie_id ?? null}
                    value={movieInfo?.name ?? ""}
                    onSelect={(id) => handleFilmSelect(id)}
                />
                <div className="text-xs text-gray-500 mt-1">Movie ID hiện tại: {movieId ?? "-"}</div>
            </div>

            <form onSubmit={handleSubmit}>
                <div className={styles.formGroup}>
                    <input
                        id="upload-file"
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className={styles.inputFile}
                        aria-label="Chọn ảnh để upload"
                    />

                    <label htmlFor="upload-file" className={styles.fileButton} aria-hidden={loading}>
                        Chọn ảnh
                    </label>

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
