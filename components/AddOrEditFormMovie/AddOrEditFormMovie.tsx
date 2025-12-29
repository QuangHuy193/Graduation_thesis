import React, { useEffect, useState } from "react";
import { MovieFullITF } from "@/lib/interface/movieInterface";
import { getCountries } from "@/lib/axios/admin/countryAPI";
import { createMovie, updateMovie } from "@/lib/axios/admin/movieAPI";
import styles from "./AddOrEditFormMovie.module.scss";
import Swal from "sweetalert2";
type Props = {
    movie: MovieFullITF | null; // null = tạo mới
    open: boolean;
    onClose: () => void;
    onSave: (m: MovieFullITF) => void;
};

function toISODate(value?: string | Date) {
    if (!value) return "";
    const d = typeof value === "string" ? new Date(value) : value;
    if (Number.isNaN(d.getTime())) return "";
    return d.toISOString().slice(0, 10);
}

export default function AddOrEditMovieModal({ movie, open, onClose, onSave }: Props) {
    const [form, setForm] = useState({
        movie_id: 0,
        name: "",
        image: "",
        trailer_url: "",
        description: "",
        release_date: "", // yyyy-mm-dd
        age_require: 0,
        country: "",
        subtitle: "",
        duration: 0,
        status: 1,
        genresCSV: "",
        actorsCSV: "",
    });
    const [submitting, setSubmitting] = useState(false);
    const [countries, setCountries] = useState<any[]>([]);
    const [subtiles, setSubtitles] = useState<any[]>([]);
    // Khi open thay đổi: nếu có movie -> populate, nếu null -> reset (dùng cho add)
    useEffect(() => {
        if (!open) return;
        (async () => {
            try {
                const data = await getCountries(); // gọi axios
                setCountries(data); // lưu danh sách
                setSubtitles(data);
            } catch (err) {
                console.error("Lỗi load countries:", err);
                setCountries([]);
                setSubtitles([]);
            }
        })();
        if (!movie) {
            // reset form for "add"
            setForm({
                movie_id: 0,
                name: "",
                image: "",
                trailer_url: "",
                description: "",
                release_date: "",
                age_require: 0,
                country: "",
                subtitle: "",
                duration: 0,
                status: 1,
                genresCSV: "",
                actorsCSV: "",
            });
            return;
        }

        // populate for edit
        setForm({
            movie_id: movie.movie_id,
            name: movie.name || "",
            image: movie.image || "",
            trailer_url: (movie.trailer_url || "").toString(),
            description: movie.description || "",
            release_date: toISODate((movie as any).release_date),
            age_require: movie.age_require ?? 0,
            country: movie.country || "",
            subtitle: movie.subtitle || "",
            duration: movie.duration ?? 0,
            status: movie.status ?? 1,
            genresCSV: Array.isArray(movie.genres) ? movie.genres.join(", ") : (movie.genres as any) || "",
            actorsCSV: Array.isArray(movie.actors) ? movie.actors.join(", ") : (movie.actors as any) || "",
        });
    }, [open, movie]);

    if (!open) return null;

    const update = (patch: Partial<typeof form>) => setForm((s) => ({ ...s, ...patch }));

    const parseCSV = (v = "") =>
        v
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name.trim()) {
            // return alert("Tiêu đề không được để trống");
            return Swal.fire("Tiêu đề không được để trống");
        }
        if (!form.country.trim()) {
            // return alert("Tiêu đề không được để trống");
            return Swal.fire("Vui lòng chọn quốc gia của phim");
        }
        if (!form.subtitle.trim()) {
            // return alert("Tiêu đề không được để trống");
            return Swal.fire("Vui lòng chọn ngôn ngữ phụ đề");
        }
        if (Number(form.duration) < 0) return Swal.fire("Thời lượng phải >= 0");;

        // build payload phù hợp MovieFullITF
        const payload: MovieFullITF = {
            movie_id: Number(form.movie_id) || 0,
            name: form.name.trim(),
            image: form.image.trim(),
            trailer_url: form.trailer_url.trim(),
            description: form.description.trim(),
            // nếu có ngày -> tạo Date object, backend chấp nhận ISO string; nhưng giữ type Date theo interface
            release_date: form.release_date ? new Date(form.release_date + "T00:00:00") : ("" as any),
            age_require: Number(form.age_require) || 0,
            country: form.country.trim(),
            subtitle: form.subtitle.trim(),
            duration: Number(form.duration) || 0,
            status: Number(form.status) || 0,
            genres: parseCSV(form.genresCSV),
            actors: parseCSV(form.actorsCSV),
        };
        const isEdit = Boolean(payload.movie_id && payload.movie_id > 0);
        setSubmitting(true);
        try {
            let resData: any;

            if (isEdit) {
                // gọi update endpoint -- dùng id hiện có
                resData = await updateMovie(payload.movie_id, payload);
            } else {
                // gọi create
                resData = await createMovie(payload);
            }

            // xử lý response chung: tìm movie trả về
            // backend có thể trả { movie } hoặc { movie_id } hoặc { data: movie }
            let returnedMovie: MovieFullITF | null = null;

            if (resData?.movie) {
                returnedMovie = resData.movie as MovieFullITF;
            } else if (resData?.data?.movie) {
                returnedMovie = resData.data.movie as MovieFullITF;
            } else if (resData?.movie_id) {
                returnedMovie = { ...payload, movie_id: Number(resData.movie_id) };
            } else if (isEdit) {
                // nếu update không trả movie nhưng thành công, dùng payload
                returnedMovie = payload;
            } else {
                // fallback: dùng payload (create nhưng backend không trả id)
                returnedMovie = { ...payload, movie_id: payload.movie_id || 0 };
            }

            onSave(returnedMovie);
            onClose();
            // alert(isEdit ? "Cập nhật phim thành công!" : "Thêm phim thành công!");
            Swal.fire(isEdit ? "Cập nhật phim thành công!" : "Thêm phim thành công!");
        } catch (err: any) {
            console.error("Lỗi khi gọi API:", err);
            const msg = err?.response?.data?.message || err?.response?.data?.error || err?.message || "Lỗi khi lưu phim";
            // alert("Lỗi: " + msg);
            Swal.fire("Lỗi: " + msg);
        } finally {
            setSubmitting(false);
        }

    };

    const isEdit = !!(movie && movie.movie_id);

    return (
        <div className="fixed inset-0 z-50 flex items-start md:items-center justify-center bg-black/50 p-4 overflow-auto">
            <form onSubmit={handleSubmit} className={`${styles.modal} ${styles.scrollable} bg-white rounded shadow max-w-3xl w-full p-4 space-y-3 overflow-auto max-h-[90vh]`}>
                <div className={`${styles.header}`}>
                    <h3 className={`${styles.title} text-lg`}>{isEdit ? "Sửa phim" : "Thêm phim mới"}</h3>
                    <div className="flex items-center gap-2">
                        <button type="button" onClick={() => {
                            // reset if adding
                            if (!isEdit) {
                                setForm({
                                    movie_id: 0,
                                    name: "",
                                    image: "",
                                    trailer_url: "",
                                    description: "",
                                    release_date: "",
                                    age_require: 0,
                                    country: "",
                                    subtitle: "",
                                    duration: 0,
                                    status: 1,

                                    genresCSV: "",
                                    actorsCSV: "",
                                });
                            }
                            onClose();
                        }} className="px-3 py-1 border rounded cursor-pointer bg-red-500 text-white">Đóng</button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                        <label className={`${styles.label} text-xs`}>Tiêu đề <b className="text-red-500 text-xs">*</b></label>
                        <input className={`${styles.input} w-full`} value={form.name} onChange={(e) => update({ name: e.target.value })} />
                    </div>

                    <div>
                        <label className={`${styles.label} text-xs`}>Ngày công chiếu</label>
                        <input type="date" className={`${styles.input} w-full`} value={form.release_date} onChange={(e) => update({ release_date: e.target.value })} />
                    </div>

                    <div>
                        <label className={`${styles.label} text-xs`}>Thời lượng (phút)</label>
                        <input type="number" min={0} className={`${styles.input} w-full`} value={String(form.duration)} onChange={(e) => update({ duration: Number(e.target.value) })} />
                    </div>

                    <div>
                        <label className={`${styles.label} text-xs`}>Độ tuổi</label>
                        <input type="number" min={0} className={`${styles.input} w-full`} value={String(form.age_require)} onChange={(e) => update({ age_require: Number(e.target.value) })} />
                    </div>

                    <div>
                        <label className={`${styles.label} text-xs`}>Quốc gia <b className="text-red-500 text-xs">*</b></label>
                        <input
                            className={`${styles.input} w-full`}
                            list="country-list"
                            value={form.country}
                            onChange={(e) => update({ country: e.target.value })}
                            placeholder="Chọn quốc gia..."
                        />

                        <datalist id="country-list">
                            {Array.isArray(countries) &&
                                countries.map((c: any) => (
                                    <option key={c.country_id} value={c.name} />
                                ))}
                        </datalist>
                    </div>

                    <div>
                        <label className={`${styles.label} text-xs`}>Phụ đề <b className="text-red-500 text-xs">*</b></label>
                        <input
                            className={`${styles.input} w-full`}
                            list="subtitle-list"
                            value={form.subtitle}
                            onChange={(e) => update({ subtitle: e.target.value })}
                            placeholder="Chọn phụ đề..."
                        />

                        <datalist id="subtitle-list">
                            {Array.isArray(subtiles) &&
                                subtiles.map((c: any) => (
                                    <option key={c.country_id} value={c.name} />
                                ))}
                        </datalist>
                    </div>



                    <div className={`${styles.colSpan2} md:col-span-2`}>
                        <label className={`${styles.label} text-xs`}>Trailer (embed URL)</label>
                        <input className={`${styles.input} w-full`} value={form.trailer_url} onChange={(e) => update({ trailer_url: e.target.value })} />
                        {form.trailer_url ? (
                            <div className={`mt-2 ${styles.embed}`}>
                                {/* Render only if looks like an embed src (you may adjust) */}
                                <iframe title="preview-trailer" className="w-full h-full" src={form.trailer_url} allowFullScreen />
                            </div>
                        ) : null}
                    </div>

                    <div className={`${styles.colSpan2} md:col-span-2`}>
                        <label className={`${styles.label} text-xs`}>Thể loại (phân tách bởi dấu phẩy)</label>
                        <input className={`${styles.input} w-full`} value={form.genresCSV} onChange={(e) => update({ genresCSV: e.target.value })} placeholder="Hài, Hành động, ..." />
                    </div>

                    <div className={`${styles.colSpan2} md:col-span-2`}>
                        <label className={`${styles.label} text-xs`}>Diễn viên (phân tách bởi dấu phẩy)</label>
                        <input className={`${styles.input} w-full`} value={form.actorsCSV} onChange={(e) => update({ actorsCSV: e.target.value })} placeholder="Tên A, Tên B, ..." />
                    </div>

                    <div className={`${styles.colSpan2} md:col-span-2`}>
                        <label className={`${styles.label} text-xs`}>Mô tả</label>
                        <textarea rows={4} className={`${styles.textarea} w-full`} value={form.description} onChange={(e) => update({ description: e.target.value })} />
                    </div>

                    <div>
                        <label className={`${styles.label} text-xs`}>Trạng thái</label>
                        <select className={`${styles.select} w-full`} value={String(form.status)} onChange={(e) => update({ status: Number(e.target.value) })}>
                            <option value={1}>Đang chiếu</option>
                            <option value={0}>Sắp chiếu</option>
                            <option value={-1}>Ẩn</option>
                        </select>
                    </div>

                    {/* <div>
                        <label className={`${styles.label} text-xs`}>Giá cơ bản</label>
                        <input type="number" className={`${styles.input} w-full`} value={String(form.price_base)} onChange={(e) => update({ price_base: Number(e.target.value) })} />
                    </div> */}
                </div>

                <div className={`${styles.footer}`}>
                    <button type="button" onClick={onClose} className={`${styles.btn} px-3 py-1 border rounded`}>Hủy</button>
                    <button
                        type="submit"
                        className={`${styles.btn} ${styles.btnPrimary} px-3 py-1 rounded`}
                        disabled={submitting}
                    >
                        {submitting ? (isEdit ? "Đang lưu..." : "Đang tạo...") : isEdit ? "Lưu" : "Tạo"}
                    </button>
                </div>
            </form>
        </div>
    );
}
