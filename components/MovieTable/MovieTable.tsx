import React, { useEffect, useMemo, useState } from "react";
import { MovieFullITF } from "@/lib/interface/movieInterface";
import AddOrEditMovieModal from "@/components/AddOrEditFormMovie/AddOrEditFormMovie";
import { deleteMovie } from "@/lib/axios/admin/movieAPI";
import Button from "../Button/Button";
import { useRouter } from "next/navigation";
type Props = {
    movies: MovieFullITF[];
    onEdit: (m: MovieFullITF) => void;
    onDelete: (id: number) => void;
};
function shallowMovieComparable(m: MovieFullITF) {
    // trả về object chỉ chứa các field chúng ta so sánh để đơn giản hóa
    return {
        movie_id: m.movie_id,
        name: m.name || "",
        description: m.description || "",
        trailer_url: m.trailer_url || "",
        release_date: m.release_date ? String(m.release_date) : "",
        price_base: m.price_base ?? null,
        status: m.status ?? null,
        age_require: m.age_require ?? null,
        country: m.country ?? "",
        subtitle: m.subtitle ?? "",
        duration: m.duration ?? null,
        // genres & actors so sánh dưới dạng string chuẩn
        genres: Array.isArray(m.genres) ? m.genres.join(",") : (m.genres || ""),
        actors: Array.isArray(m.actors) ? m.actors.join(",") : (m.actors || "")
    };
}
export default function AdminMovieTable({ movies, onEdit, onDelete }: Props) {
    const [localMovies, setLocalMovies] = useState<MovieFullITF[]>(movies || []);
    const [query, setQuery] = useState("");
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(8);
    const [sortBy, setSortBy] = useState<"release_date" | "name" | "duration">("release_date");
    const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
    const [selectedTrailer, setSelectedTrailer] = useState<string | null>(null);
    const [editing, setEditing] = useState<MovieFullITF | null>(null);
    const [editOpen, setEditOpen] = useState(false);
    const router = useRouter();
    useEffect(() => {
        setLocalMovies(movies || []);
    }, [movies]);
    // function goToUploadWithId(m: MovieFullITF) {
    //     router.push(`/uploadpic?movieId=${encodeURIComponent(String(m.movie_id))}`);
    // }
    function goToUploadWithId(movieId: number) {
        if (!movieId || Number.isNaN(Number(movieId))) {
            console.warn("Invalid movieId:", movieId);
            return;
        }
        router.push(`/admin/uploadpic?movieId=${encodeURIComponent(String(movieId))}`);
    }

    const handleOpenEdit = (m: MovieFullITF) => {
        setEditing(m);
        setEditOpen(true);
    };
    const handleSaveEdit = (updated: MovieFullITF) => {
        if (!updated || !updated.movie_id) {
            alert("Dữ liệu trả về không hợp lệ");
            return;
        }

        const idx = localMovies.findIndex((x) => x.movie_id === updated.movie_id);
        const old = idx >= 0 ? localMovies[idx] : null;

        if (old) {
            const a = shallowMovieComparable(old);
            const b = shallowMovieComparable(updated);
            const same = JSON.stringify(a) === JSON.stringify(b);

            if (same) {
                // không có thay đổi thực tế
                alert("Không có thay đổi nào được lưu.");
            } else {
                // update local list
                const next = localMovies.slice();
                next[idx] = { ...next[idx], ...updated };
                setLocalMovies(next);
                // thông báo cho parent (nếu cần)
                onEdit(updated);
                alert("Cập nhật phim thành công!");
            }
        } else {
            // item không tồn tại trong local (có thể là mới) -> thêm/replace
            setLocalMovies((prev) => [updated, ...prev]);
            onEdit(updated);
            alert("Đã thêm phim (fallback).");
        }

        // đóng modal và reset editing
        setEditOpen(false);
        setEditing(null);
    };
    const handleDel = async (id: number) => {
        if (!id || id <= 0) {
            alert("ID không hợp lệ");
            return;
        }

        const confirmDelete = confirm(`Bạn có chắc muốn xoá phim này ?`);
        if (!confirmDelete) return;

        try {
            const res = await deleteMovie(id);

            if (res?.success) {
                alert("Xóa phim thành công!");
                onDelete(id);
                // Nếu bạn có hàm refresh list thì gọi ở đây
                // await fetchMovies();

            } else {
                alert("Xóa thất bại: " + (res?.error || "Không rõ lỗi"));
            }
        } catch (error: any) {
            console.error("Lỗi xóa movie:", error);
            alert("Lỗi: " + (error.response?.data?.error || error.message));
        }
    };

    // Filters + search + sort
    const filtered = useMemo(() => {
        let list = localMovies.slice();

        if (query.trim()) {
            const q = query.toLowerCase();

            const toList = (v?: string[] | string) =>
                Array.isArray(v)
                    ? v.map((s) => (s || "").toString())
                    : typeof v === "string"
                        ? v.split(",").map((s) => s.trim()).filter(Boolean)
                        : [];

            list = list.filter((m) => {
                const nameMatch = (m.name || "").toLowerCase().includes(q);
                const descMatch = (m.description || "").toLowerCase().includes(q);

                const genresList = toList(m.genres);
                const actorsList = toList(m.actors);

                const matchGenres = genresList.some((g) => g.toLowerCase().includes(q));
                const matchActors = actorsList.some((a) => a.toLowerCase().includes(q));

                return nameMatch || descMatch || matchGenres || matchActors;
            });
        }

        list.sort((a, b) => {
            const dir = sortDir === "asc" ? 1 : -1;
            if (sortBy === "name") return dir * a.name.localeCompare(b.name);
            if (sortBy === "duration") return dir * ((a.duration ?? 0) - (b.duration ?? 0));
            return dir * (new Date(a.release_date).getTime() - new Date(b.release_date).getTime());
        });

        return list;
    }, [localMovies, query, sortBy, sortDir]);

    const total = filtered.length;
    const pages = Math.max(1, Math.ceil(total / perPage));
    const start = (page - 1) * perPage;
    const paginated = filtered.slice(start, start + perPage);

    const fmtDate = (iso?: string) => {
        if (!iso) return "-";
        try {
            return new Date(iso).toLocaleDateString();
        } catch (e) {
            return iso;
        }
    };

    const truncate = (s: any, n = 120) => {
        s = typeof s === "string" ? s : "";
        return s.length > n ? s.slice(0, n).trimEnd() + "..." : s;
    };



    return (
        <div className="bg-white rounded shadow overflow-hidden">
            {/* Controls */}
            <div className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="flex items-center gap-2">
                    <input
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            setPage(1);
                        }}
                        placeholder="Tìm theo tiêu đề, mô tả, diễn viên, thể loại..."
                        className="border rounded px-3 py-2 w-64 text-sm"
                    />
                    <select
                        value={perPage}
                        onChange={(e) => {
                            setPerPage(Number(e.target.value));
                            setPage(1);
                        }}
                        className="border rounded px-2 py-2 text-sm"
                    >
                        <option value={8}>8 / trang</option>
                        <option value={12}>12 / trang</option>
                        <option value={24}>24 / trang</option>
                    </select>
                </div>

                <div className="flex items-center gap-2">
                    <label className="text-sm">Sắp xếp:</label>
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="border rounded px-2 py-2 text-sm"
                    >
                        <option value="release_date">Ngày công chiếu</option>
                        <option value="name">Tiêu đề</option>
                        <option value="duration">Thời lượng</option>
                    </select>
                    <button
                        onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
                        className="px-3 py-1 border rounded text-sm"
                        title="Đổi chiều sắp xếp"
                    >
                        {sortDir === "asc" ? "⤴️" : "⤵️"}
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full table-auto">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="text-left px-4 py-3">Poster</th>
                            <th className="text-left px-4 py-3">Tiêu đề</th>
                            <th className="text-left px-4 py-3">Thể loại</th>
                            <th className="text-left px-4 py-3">Thời lượng</th>
                            <th className="text-left px-4 py-3">Quốc gia</th>
                            <th className="text-left px-4 py-3">Tóm tắt</th>
                            <th className="text-left px-4 py-3">Ngày công chiếu</th>
                            <th className="text-left px-4 py-3">Độ tuổi</th>
                            <th className="text-left px-4 py-3">Trạng thái</th>
                            <th className="text-right px-4 py-3">Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginated.map((m) => (
                            <tr key={m.movie_id} className="border-t group hover:bg-slate-50">
                                <td className="px-4 py-3">
                                    <div className="w-16 h-24 bg-slate-100 rounded overflow-hidden flex items-center justify-center">
                                        {m.image ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                                src={m.image}
                                                alt={m.name}
                                                className="w-full h-full object-cover cursor-pointer"
                                                onClick={() => goToUploadWithId(m.movie_id)}
                                            />
                                        ) : (
                                            <span className="text-xs cursor-pointer" onClick={() => goToUploadWithId(m.movie_id)}>No image</span>
                                        )}
                                    </div>
                                </td>

                                <td className="px-4 py-3 max-w-xs">
                                    <div className="font-medium">{m.name}</div>
                                    <div className="text-xs text-slate-500">Trailer: {m.trailer_url ? (
                                        <button
                                            onClick={() => setSelectedTrailer(m.trailer_url.trim())}
                                            className="underline text-sm"
                                        >
                                            Xem
                                        </button>
                                    ) : (
                                        "-"
                                    )}</div>
                                </td>

                                <td className="px-4 py-3">
                                    <div className="flex flex-wrap gap-1">
                                        {/* {m.genres?.map((g) => (
                                            <span key={g} className="text-xs px-2 py-1 border rounded-full">{g.trim()}</span>
                                        ))} */}
                                        {(Array.isArray(m.genres) ? m.genres : (m.genres || "").split(",")).map((g) => (
                                            <span key={g} className="text-xs px-2 py-1 border rounded-full">{g.trim()}</span>
                                        ))}

                                    </div>
                                </td>

                                <td className="px-4 py-3">{m.duration} min</td>
                                <td className="px-4 py-3">{m.country || "-"}</td>

                                <td className="px-4 py-3 max-w-[36ch] text-sm text-slate-700">{truncate(m.description, 140)}</td>

                                <td className="px-4 py-3">{fmtDate(m.release_date.toString())}</td>
                                <td className="px-4 py-3">{m.age_require ?? "-"}</td>

                                <td className="px-4 py-3">
                                    {m.status === 1 ? (
                                        <span className="inline-block text-xs px-2 py-1 rounded-full bg-green-100">
                                            Đang chiếu
                                        </span>
                                    ) : m.status === 0 ? (
                                        <span className="inline-block text-xs px-2 py-1 rounded-full bg-blue-100">
                                            Sắp chiếu
                                        </span>
                                    ) : (
                                        <span className="inline-block text-xs px-2 py-1 rounded-full bg-slate-100">
                                            Ẩn
                                        </span>
                                    )}
                                </td>

                                <td className="px-4 py-3 text-right">
                                    <div className="inline-flex gap-2">
                                        <Button onClick={() => handleOpenEdit(m)} className="px-3 py-1 rounded border text-sm">Sửa</Button>
                                        <Button
                                            onClick={() => handleDel(m.movie_id)}
                                            className="px-3 py-1 rounded border text-sm text-red-600"
                                        >
                                            Xóa
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ))}

                        {paginated.length === 0 && (
                            <tr>
                                <td colSpan={10} className="px-4 py-6 text-center text-slate-500">
                                    Không có phim nào.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Footer / Pagination */}
            <div className="p-4 flex items-center justify-between">
                <div className="text-sm text-slate-600">Hiển thị {start + 1} - {Math.min(start + perPage, total)} / {total}</div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        className="px-3 py-1 border rounded"
                        disabled={page === 1}
                    >
                        Prev
                    </button>
                    <div className="text-sm">{page} / {pages}</div>
                    <button
                        onClick={() => setPage((p) => Math.min(pages, p + 1))}
                        className="px-3 py-1 border rounded"
                        disabled={page === pages}
                    >
                        Next
                    </button>
                </div>
            </div>

            {/* Trailer modal (simple) */}
            {selectedTrailer && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded shadow max-w-3xl w-full overflow-hidden">
                        <div className="p-3 flex justify-between items-center border-b">
                            <div className="font-medium">Trailer</div>
                            <button onClick={() => setSelectedTrailer(null)} className="px-3 py-1 rounded border">Đóng</button>
                        </div>
                        <div className="p-4">
                            <div className="aspect-video w-full">
                                {/* embed safe - assume trailer_url is an embed link */}
                                {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
                                <iframe
                                    title="trailer"
                                    className="w-full h-full"
                                    src={selectedTrailer}
                                    allowFullScreen
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}
            <AddOrEditMovieModal
                movie={editing}
                open={editOpen}
                onClose={() => { setEditOpen(false); setEditing(null); }}
                onSave={handleSaveEdit}
            />
        </div>
    );

}

// File: AdminMovieTable.tsx
