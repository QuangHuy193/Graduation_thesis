import React, { useEffect, useState } from "react";
import { MovieFullITF } from "@/lib/interface/movieInterface";
import { createMovie } from "@/lib/axios/admin/movieAPI";
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
        price_base: 0,
        genresCSV: "",
        actorsCSV: "",
    });
    const [submitting, setSubmitting] = useState(false);
    // Khi open thay đổi: nếu có movie -> populate, nếu null -> reset (dùng cho add)
    useEffect(() => {
        if (!open) return;

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
                price_base: 0,
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
            price_base: movie.price_base ?? 0,
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
        if (!form.name.trim()) return alert("Tiêu đề không được để trống");
        if (Number(form.duration) < 0) return alert("Thời lượng phải >= 0");

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
            price_base: Number(form.price_base) || 0,
            genres: parseCSV(form.genresCSV),
            actors: parseCSV(form.actorsCSV),
        };

        // Nếu đang edit: tuỳ API, bạn có thể gọi update endpoint thay vì create.
        // Ở đây mặc định gọi createMovie cho cả 2 trường hợp. Nếu backend có /update, thay logic tương ứng.
        setSubmitting(true);
        try {
            const res = await createMovie(payload); // gọi axios
            // xử lý response:
            // giả định res.movie hoặc res.movie_id
            const returnedMovie: MovieFullITF | null = res?.movie
                ? (res.movie as MovieFullITF)
                : res?.movie_id
                    ? { ...payload, movie_id: Number(res.movie_id) }
                    : { ...payload, movie_id: payload.movie_id || 0 };

            // call parent
            onSave(returnedMovie);
            onClose();
            alert("Thêm phim thành công!");
        } catch (err: any) {
            console.error("Lỗi khi gọi API:", err);
            const msg = err?.response?.data?.error || err?.message || "Lỗi khi thêm phim";
            alert("Lỗi: " + msg);
        } finally {
            setSubmitting(false);
        }
    };

    const isEdit = !!(movie && movie.movie_id);

    return (
        <div className="fixed inset-0 z-50 flex items-start md:items-center justify-center bg-black/50 p-4 overflow-auto">
            <form onSubmit={handleSubmit} className="bg-white rounded shadow max-w-3xl w-full p-4 space-y-3 overflow-auto max-h-[90vh]">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">{isEdit ? "Sửa phim" : "Thêm phim mới"}</h3>
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
                                    price_base: 0,
                                    genresCSV: "",
                                    actorsCSV: "",
                                });
                            }
                            onClose();
                        }} className="px-3 py-1 border rounded">Đóng</button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                        <label className="text-xs">Tiêu đề</label>
                        <input className="w-full border rounded px-2 py-1" value={form.name} onChange={(e) => update({ name: e.target.value })} />
                    </div>

                    <div>
                        <label className="text-xs">Ngày công chiếu</label>
                        <input type="date" className="w-full border rounded px-2 py-1" value={form.release_date} onChange={(e) => update({ release_date: e.target.value })} />
                    </div>

                    <div>
                        <label className="text-xs">Thời lượng (phút)</label>
                        <input type="number" min={0} className="w-full border rounded px-2 py-1" value={String(form.duration)} onChange={(e) => update({ duration: Number(e.target.value) })} />
                    </div>

                    <div>
                        <label className="text-xs">Độ tuổi</label>
                        <input type="number" min={0} className="w-full border rounded px-2 py-1" value={String(form.age_require)} onChange={(e) => update({ age_require: Number(e.target.value) })} />
                    </div>

                    <div>
                        <label className="text-xs">Quốc gia</label>
                        <input className="w-full border rounded px-2 py-1" value={form.country} onChange={(e) => update({ country: e.target.value })} />
                    </div>

                    <div>
                        <label className="text-xs">Subtitle</label>
                        <input className="w-full border rounded px-2 py-1" value={form.subtitle} onChange={(e) => update({ subtitle: e.target.value })} />
                    </div>

                    <div className="md:col-span-2">
                        <label className="text-xs">Poster (image URL)</label>
                        <input className="w-full border rounded px-2 py-1" value={form.image} onChange={(e) => update({ image: e.target.value })} />
                        {form.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={form.image} alt="preview" className="mt-2 w-32 h-48 object-cover border rounded" />
                        ) : null}
                    </div>

                    <div className="md:col-span-2">
                        <label className="text-xs">Trailer (embed URL)</label>
                        <input className="w-full border rounded px-2 py-1" value={form.trailer_url} onChange={(e) => update({ trailer_url: e.target.value })} />
                        {form.trailer_url ? (
                            <div className="mt-2 aspect-video w-full">
                                {/* Render only if looks like an embed src (you may adjust) */}
                                <iframe title="preview-trailer" className="w-full h-full" src={form.trailer_url} allowFullScreen />
                            </div>
                        ) : null}
                    </div>

                    <div className="md:col-span-2">
                        <label className="text-xs">Thể loại (phân tách bởi dấu phẩy)</label>
                        <input className="w-full border rounded px-2 py-1" value={form.genresCSV} onChange={(e) => update({ genresCSV: e.target.value })} placeholder="Hài, Hành động, ..." />
                    </div>

                    <div className="md:col-span-2">
                        <label className="text-xs">Diễn viên (phân tách bởi dấu phẩy)</label>
                        <input className="w-full border rounded px-2 py-1" value={form.actorsCSV} onChange={(e) => update({ actorsCSV: e.target.value })} placeholder="Tên A, Tên B, ..." />
                    </div>

                    <div className="md:col-span-2">
                        <label className="text-xs">Mô tả</label>
                        <textarea rows={4} className="w-full border rounded px-2 py-1" value={form.description} onChange={(e) => update({ description: e.target.value })} />
                    </div>

                    <div>
                        <label className="text-xs">Trạng thái</label>
                        <select className="w-full border rounded px-2 py-1" value={String(form.status)} onChange={(e) => update({ status: Number(e.target.value) })}>
                            <option value={1}>Đang chiếu</option>
                            <option value={0}>Sắp chiếu</option>
                            <option value={-1}>Ẩn</option>
                        </select>
                    </div>

                    <div>
                        <label className="text-xs">Giá cơ bản</label>
                        <input type="number" className="w-full border rounded px-2 py-1" value={String(form.price_base)} onChange={(e) => update({ price_base: Number(e.target.value) })} />
                    </div>
                </div>

                <div className="flex justify-end gap-2 mt-2">
                    <button type="button" onClick={onClose} className="px-3 py-1 border rounded">Hủy</button>
                    <button
                        type="submit"
                        className="px-3 py-1 rounded bg-blue-600 text-white"
                        disabled={submitting}
                    >
                        {submitting ? (isEdit ? "Đang lưu..." : "Đang tạo...") : isEdit ? "Lưu" : "Tạo"}
                    </button>
                </div>
            </form>
        </div>
    );
}
