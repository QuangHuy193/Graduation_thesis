// "use client";

// import { useState, useEffect } from "react";
// import styles from "./UploadForm.module.scss";
// import FilmDatalist from "@/components/FlimDataList/FilmDatalist";
// import { uploadToCloudinary } from "@/lib/axios/uploadCloudinaryAPI";
// import { saveImageToDB } from "@/lib/axios/saveImageToDB";
// import Button from "../Button/Button";
// import { useSearchParams } from "next/navigation";
// import axios from "axios";
// import { MovieFullITF } from "@/lib/interface/movieInterface";
// import { getMovieWithIdAPI } from "@/lib/axios/admin/movieAPI";
// type Message = { type: "error" | "success"; text: string } | null;

// type UploadedImage = {
//     url: string | null;
//     public_id?: string | null;
//     caption?: string | null;
// } | null;

// export default function UploadForm() {
//     const searchParams = useSearchParams();
//     const movieIdParam = searchParams?.get("movieId") ?? null;
//     const [file, setFile] = useState<File | null>(null);
//     const [preview, setPreview] = useState<string | null>(null);
//     const [caption, setCaption] = useState<string>("");
//     const [loading, setLoading] = useState<boolean>(false);
//     const [message, setMessage] = useState<Message>(null);
//     const [uploaded, setUploaded] = useState<UploadedImage>(null);
//     const [movieId, setMovieId] = useState<number | null>(null);
//     const [progress, setProgress] = useState<number>(0);
//     const [movieInfo, setMovieInfo] = useState<MovieFullITF | null>(null);
//     const [movieLoading, setMovieLoading] = useState(false);
//     const [movieError, setMovieError] = useState<string | null>(null);
//     useEffect(() => {
//         return () => {
//             if (preview) URL.revokeObjectURL(preview);
//         };
//     }, [preview]);
//     useEffect(() => {
//         if (!movieIdParam) return;

//         const id = Number(movieIdParam);
//         if (!id || Number.isNaN(id)) {
//             setMovieError("movieId không hợp lệ trong URL");
//             return;
//         }

//         setMovieId(id);
//         setMovieLoading(true);
//         setMovieError(null);

//         let cancelled = false;
//         (async () => {
//             try {
//                 // support nhiều định dạng response phổ biến:
//                 const data = await getMovieWithIdAPI(id);

//                 if (!cancelled) {
//                     if (data) {
//                         setMovieInfo(data as MovieFullITF);
//                         // optional: prefill caption với tên phim (bạn muốn)
//                         setCaption((data as any)?.name ? `Poster - ${(data as any).name}` : "");
//                     } else {
//                         setMovieError("Không tìm thấy movie");
//                     }
//                 }
//             } catch (err: any) {
//                 console.error("Lỗi fetch movie:", err);
//                 if (!cancelled) setMovieError(err?.response?.data?.message || err.message || "Lỗi khi lấy movie");
//             } finally {
//                 if (!cancelled) setMovieLoading(false);
//             }
//         })();

//         return () => {
//             cancelled = true;
//         };
//     }, [movieIdParam]);

//     function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
//         const f = e.target.files?.[0] ?? null;
//         setFile(f);
//         setMessage(null);

//         if (preview) URL.revokeObjectURL(preview);
//         setPreview(f ? URL.createObjectURL(f) : null);
//     }

//     async function handleSubmit(e: React.FormEvent) {
//         e.preventDefault();
//         if (!file) {
//             setMessage({ type: "error", text: "Chọn file trước khi upload." });
//             return;
//         }

//         setLoading(true);
//         setMessage(null);
//         setProgress(0);

//         try {
//             // 1) Upload lên Cloudinary
//             const cloudData = await uploadToCloudinary(file, {
//                 onUploadProgress: (p) => setProgress(p),
//                 // folder: 'movies' // nếu muốn
//             });

//             const url = cloudData.secure_url;
//             const public_id = cloudData.public_id;

//             // 2) Lưu vào DB bằng axios helper
//             const savePayload = {
//                 url,
//                 public_id,
//                 movie_id: movieId ?? null,
//                 type: caption ? "gallery" : "poster",
//             };

//             const saveRes = await saveImageToDB(savePayload);

//             // axios sẽ throw nếu HTTP 4xx/5xx, nhưng server có thể trả success: false
//             if (!saveRes || !saveRes.success) {
//                 throw new Error((saveRes as any)?.error ?? "Save to DB failed");
//             }

//             setMessage({ type: "success", text: "Upload & lưu thành công!" });
//             setUploaded({ url, public_id, caption });

//             // reset form
//             setFile(null);
//             if (preview) URL.revokeObjectURL(preview);
//             setPreview(null);
//             setCaption("");
//             // setMovieId(null);
//         } catch (err: any) {
//             // axios error handling
//             const text = err?.response?.data?.error ?? err?.message ?? String(err);
//             setMessage({ type: "error", text });
//         } finally {
//             setLoading(false);
//             setProgress(0);
//         }
//     }

//     //    
//     return (
//         <div className={styles.container}>
//             <h2 className={styles.title}>Upload ảnh</h2>

//             {/* nếu có movieId từ query -> show info */}
//             {movieId ? (
//                 <div className={styles.movieInfo}>
//                     {movieLoading ? (
//                         <div className={styles.smallText}>Đang tải thông tin phim #{movieId}…</div>
//                     ) : movieError ? (
//                         <div className={styles.smallText} style={{ color: "red" }}>{movieError}</div>
//                     ) : movieInfo ? (
//                         <div className={styles.movieCard}>
//                             <div className={styles.moviePoster}>
//                                 {movieInfo.image ? (
//                                     // eslint-disable-next-line @next/next/no-img-element
//                                     <img src={String(movieInfo.image)} alt={movieInfo.name ?? "poster"} />
//                                 ) : (
//                                     <div className={styles.noPoster}>No poster</div>
//                                 )}
//                             </div>
//                             <div className={styles.movieMeta}>
//                                 <div className={styles.movieTitle}>{movieInfo.name}</div>
//                                 <div className={styles.movieSub}>ID: {movieInfo.movie_id}</div>
//                                 <div className={styles.movieSub}>{movieInfo.duration ? `${movieInfo.duration} phút` : ""}</div>
//                             </div>
//                         </div>
//                     ) : null}
//                 </div>
//             ) : null}

//             <div style={{ marginBottom: 12 }}>
//                 <label className="block text-sm font-medium mb-1">Gán cho phim (tuỳ chọn)</label>
//                 <FilmDatalist
//                     placeholder="Gõ tên phim..."
//                     onSelect={(id) => {
//                         setMovieId(id);
//                         // nếu đổi phim thủ công thì refetch info
//                         if (id) {
//                             (async () => {
//                                 try {
//                                     setMovieLoading(true);
//                                     setMovieError(null);
//                                     const res = await axios.get(`/api/movies/${id}`);
//                                     const data = res?.data?.data || res?.data?.movie || res?.data || null;
//                                     setMovieInfo(data);
//                                 } catch (err: any) {
//                                     console.error("Lỗi fetch movie:", err);
//                                     setMovieError(err?.response?.data?.message || err.message || "Lỗi khi lấy movie");
//                                 } finally {
//                                     setMovieLoading(false);
//                                 }
//                             })();
//                         } else {
//                             setMovieInfo(null);
//                         }
//                     }}
//                 />
//                 <div className="text-xs text-gray-500 mt-1">Movie ID hiện tại: {movieId ?? "-"}</div>
//             </div>

//             <form onSubmit={handleSubmit}>
//                 <div className={styles.formGroup}>
//                     {/* input ẩn, vẫn dùng onChange để set file */}
//                     <input
//                         id="upload-file"
//                         type="file"
//                         accept="image/*"
//                         onChange={handleFileChange}
//                         className={styles.inputFile}
//                         aria-label="Chọn ảnh để upload"
//                     />

//                     {/* label sẽ hiện như button */}
//                     <label htmlFor="upload-file" className={styles.fileButton} aria-hidden={loading}>
//                         Chọn ảnh
//                     </label>

//                     {/* hiển thị tên file nếu đã chọn */}
//                     <div className={styles.fileMeta}>
//                         {file ? (
//                             <span className={styles.fileName}>{file.name}</span>
//                         ) : (
//                             <span className={styles.noFile}>Chưa chọn file</span>
//                         )}
//                     </div>
//                 </div>

//                 {preview && (
//                     <div className={styles.preview}>
//                         <p>Preview:</p>
//                         <img src={preview} alt="preview" />
//                     </div>
//                 )}

//                 <div className={styles.formGroup}>
//                     <input
//                         type="text"
//                         placeholder="Caption (tùy chọn)"
//                         value={caption}
//                         onChange={(e) => setCaption(e.target.value)}
//                         className={styles.inputText}
//                     />
//                 </div>

//                 {progress > 0 && (
//                     <div style={{ marginBottom: 8 }}>
//                         <div style={{ height: 8, background: "#eee", borderRadius: 6, overflow: "hidden" }}>
//                             <div style={{ width: `${progress}%`, height: "100%", background: "#06f" }} />
//                         </div>
//                         <div className="text-xs text-gray-500 mt-1">{progress}%</div>
//                     </div>
//                 )}

//                 <Button type="submit" className={styles.button} disabled={loading}>
//                     {loading ? "Đang upload..." : "Upload và Lưu"}
//                 </Button>
//             </form>

//             {message && <div className={`${styles.message} ${styles[message?.type ?? ""]}`}>{message.text}</div>}

//             {uploaded && uploaded.url && (
//                 <div className={styles.uploaded}>
//                     <p>Ảnh đã lưu:</p>
//                     <a href={uploaded.url} target="_blank" rel="noreferrer">
//                         <img src={uploaded.url} alt={uploaded.caption ?? ""} />
//                     </a>
//                     {uploaded.caption && <p>{uploaded.caption}</p>}
//                 </div>
//             )}
//         </div>
//     );
// }
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
        if (!movieIdParam) return;

        const id = Number(movieIdParam);
        if (!id || Number.isNaN(id)) {
            setMovieError("movieId không hợp lệ trong URL");
            return;
        }

        setMovieId(id);
        setMovieLoading(true);
        setMovieError(null);

        let cancelled = false;

        (async () => {
            try {
                const data = await getMovieWithIdAPI(id);
                if (cancelled) return;
                if (data) {
                    setMovieInfo(data as MovieFullITF);
                    setCaption(data?.name ? `Poster - ${data.name}` : "");
                } else {
                    setMovieInfo(null);
                    setMovieError("Không tìm thấy movie");
                }
            } catch (err: any) {
                if (cancelled) return;
                console.error("Lỗi fetch movie:", err);
                // đọc err.message (do chúng ta đã chuẩn hóa khi throw)
                const msg = err?.message ?? (typeof err === "string" ? err : "Lỗi khi lấy movie");
                setMovieError(msg);
            } finally {
                if (!cancelled) setMovieLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [movieIdParam]);

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
                type: caption ? "gallery" : "poster",
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
        setMovieId(id);
        if (!id) {
            setMovieInfo(null);
            return;
        }
        setMovieLoading(true);
        setMovieError(null);
        try {
            const data = await getMovieWithIdAPI(id);
            if (data) {
                setMovieInfo(data);
            } else {
                setMovieInfo(null);
                setMovieError("Không tìm thấy movie");
            }
        } catch (err: any) {
            console.error("Lỗi fetch movie:", err);
            setMovieError(err?.response?.data?.message || err.message || "Lỗi khi lấy movie");
        } finally {
            setMovieLoading(false);
        }
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
                    ) : movieInfo ? (
                        <div className={styles.movieCard}>
                            <div className={styles.moviePoster}>
                                {movieInfo.image ? (
                                    <img src={String(movieInfo.image)} alt={movieInfo.name ?? "poster"} />
                                ) : (
                                    <div className={styles.noPoster}>No poster</div>
                                )}
                            </div>
                            <div className={styles.movieMeta}>
                                <div className={styles.movieTitle}>{movieInfo.name}</div>
                                <div className={styles.movieSub}>ID: {movieInfo.movie_id}</div>
                                <div className={styles.movieSub}>{movieInfo.duration ? `${movieInfo.duration} phút` : ""}</div>
                            </div>
                        </div>
                    ) : null}
                </div>
            ) : null}

            <div style={{ marginBottom: 12 }}>
                <label className="block text-sm font-medium mb-1">Gán cho phim (tuỳ chọn)</label>
                <FilmDatalist
                    placeholder="Gõ tên phim..."
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
