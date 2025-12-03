
"use client";

import React, { useEffect, useState } from "react";
import { getAllMovies, callBulkApi } from "@/lib/axios/admin/movieAPI";
import { MovieFullITF } from "@/lib/interface/movieInterface";
import MovieTable from "@/components/MovieTable/MovieTable";
import BookingsTable from "@/components/BookingsTable/BookingsTable";
import Showtimestable, { ShowtimeRaw } from "@/components/ShowtimesTable/ShowtimesTable";
import Button from "@/components/Button/Button";
import AddOrEditMovieModal from "@/components/AddOrEditFormMovie/AddOrEditFormMovie";
import Swal from "sweetalert2";
import { getAllBookings } from "@/lib/axios/admin/bookingAPI";
import { getAllShowtimes, commitShowtimeMoves } from "@/lib/axios/admin/showtimeAPI";
import ExcelImportMovies from "@/components/ExcelImportMovies/ExcelImportMovies";
import Spinner from "@/components/Spinner/Spinner";
type PendingMove = {
    showtime_id: number;
    from_room: number | null;
    to_room: number | null;
    // optional: snapshot of updated showtime for UI
    updated?: ShowtimeRaw;
};
export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState("dashboard");
    const [movies, setMovies] = useState<MovieFullITF[]>([]);
    const [bookings, setBookings] = useState([]);
    const [showtimes, setShowtimes] = useState<ShowtimeRaw[]>([]);
    const [openImport, setOpenImport] = useState(false);
    // modal
    const [editOpen, setEditOpen] = useState(false);
    const [editingMovie, setEditingMovie] = useState<MovieFullITF | null>(null);
    // loading
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);


    useEffect(() => {
        fetchMovies();
        fetchBookings();
        fetchShowtimes();
    }, []);

    async function fetchMovies() {
        try {
            const data = await getAllMovies();
            setMovies(data);
        } catch (e) {
            console.error(e);
            // fallback: mock
            setMovies([]);
        }
    }
    async function fetchBookings() {
        try {
            const res = await getAllBookings();
            const payload = res?.data?.data ?? res?.data ?? res ?? [];
            setBookings(payload);
        } catch (e) {
            console.error(e);
            // fallback: mock
            setBookings([]);
        }
    }

    async function fetchShowtimes() {
        try {
            const payload = await getAllShowtimes();
            setShowtimes(payload);
        } catch (e) {
            console.error("fetchShowtimes error:", e);
            setShowtimes([]);
        }
    }

    async function handleImport(movies) {
        try {
            setLoading(true);
            const res = await callBulkApi(movies);

            const data = await getAllMovies();
            setMovies(data);
            Swal.fire("Nhập excel thành công");
        } catch (error) {
            console.error("Import failed:", error);
            alert("Có lỗi xảy ra khi import!");
        } finally {
            setLoading(false);
        }
    }

    function handleEdit(movie: MovieFullITF) {
        console.log("Edit:", movie);
    }

    const handleDeleteFromChild = () => {
        // simplest: fetch lại danh sách
        fetchMovies();

    };
    // parent
    const handleCommit = async (moves: PendingMove[]) => {
        if (!moves || moves.length === 0) return;

        setSaving(true);
        try {
            // commitShowtimeMoves là wrapper axios.post('/api/showtimes/move-batch', { moves: [...] })
            const res = await commitShowtimeMoves(moves);

            // nếu API trả về ok & updated rows, merge vào showtimes hiện tại
            const updatedRows = res?.data?.updated ?? res?.updated ?? null;

            if (Array.isArray(updatedRows)) {
                setShowtimes(prev =>
                    prev.map(s => {
                        const u = updatedRows.find((r: any) => Number(r.showtime_id) === Number((s as any).showtime_id));
                        return u ? { ...s, ...u } : s;
                    })
                );
            } else {
                // fallback: nếu API ko gửi updated rows, ta refetch để đồng bộ
                await fetchShowtimes();
            }

            // thông báo thành công
            Swal.fire({ icon: "success", title: "Commit thành công", timer: 1200, showConfirmButton: false });

            // trả về kết quả cho caller nếu cần
            return res;
        } catch (err: any) {
            console.error("Commit failed:", err);

            // nếu server trả lỗi 409 conflict, hiển thị thông tin chi tiết nếu có
            const api = err.response?.data ?? err;
            if (err.response?.status === 409) {
                const conflict = api?.conflict;
                const msg = conflict
                    ? `Xung đột: phòng ${conflict.target_room} có suất chồng giờ (showtime ${conflict.conflicting_show?.showtime_id}).`
                    : "Xung đột khi lưu — có suất chồng giờ.";
                Swal.fire({ icon: "error", title: "Commit thất bại", text: msg });
            } else {
                Swal.fire({ icon: "error", title: "Lỗi", text: api?.message ?? "Không thể lưu thay đổi." });
            }

            // rethrow để component con có thể rollback UI nếu nó cần
            throw err;
        } finally {
            setSaving(false);
        }
    };
    const TAB_TITLES = {
        dashboard: "Tổng quan",
        movies: "Phim",
        showtimes: "Suất chiếu",
        bookings: "Vé"
    };

    function handleOpenAdd() {
        setEditingMovie(null);
        setEditOpen(true);
    }

    async function handleSave() {
        setSaving(true);
        try {
            await fetchMovies();
        } catch (err) {
            console.error("save movie error:", err);
            // alert("Lưu phim thất bại. Kiểm tra console để biết chi tiết.");
            Swal.fire("Lưu phim thất bại. Kiểm tra console để biết chi tiết.");
        } finally {
            setSaving(false);
            setEditOpen(false);
            setEditingMovie(null);
        }
    }
    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 flex">
            <aside className="w-45 bg-white shadow-md p-6">
                <h2 className="text-xl font-semibold mb-6">Quản trị</h2>
                <nav className="space-y-2">
                    <button
                        onClick={() => setActiveTab("dashboard")}

                        className={`w-full text-left px-3 py-2 cursor-pointer rounded-md ${activeTab === "dashboard" ? "bg-slate-100" : "hover:bg-slate-50"}`}
                    >
                        Tổng quan
                    </button>
                    <button
                        onClick={() => setActiveTab("movies")}
                        className={`w-full text-left px-3 py-2 cursor-pointer rounded-md ${activeTab === "movies" ? "bg-slate-100" : "hover:bg-slate-50"}`}
                    >
                        Quản lý phim
                    </button>
                    <button
                        onClick={() => setActiveTab("bookings")}
                        className={`w-full text-left px-3 py-2 cursor-pointer rounded-md ${activeTab === "bookings" ? "bg-slate-100" : "hover:bg-slate-50"}`}
                    >
                        Quản lý vé
                    </button>
                    <button
                        onClick={() => setActiveTab("showtimes")}
                        className={`w-full text-left px-3 py-2 cursor-pointer rounded-md ${activeTab === "showtimes" ? "bg-slate-100" : "hover:bg-slate-50"}`}
                    >
                        Quản lý suất chiếu
                    </button>
                </nav>
            </aside>

            <main className="flex-1 p-8">
                {loading ? (
                    <div className="py-10 flex justify-center">
                        <Spinner text="Đang xử lý..." />
                    </div>
                ) : (<>
                    <header className="flex items-center justify-between mb-6">
                        <h1 className="text-2xl font-bold">{TAB_TITLES[activeTab] ?? "Không xác định"}</h1>
                        <div className="flex items-center gap-3">
                            {activeTab === "movies" && (
                                <div>
                                    {/* === NÚT IMPORT Ở PARENT === */}
                                    <Button
                                        onClick={() => setOpenImport(true)}
                                        className="px-4 py-2 bg-blue-600 text-white rounded"
                                    >
                                        Nhập từ Excel
                                    </Button>

                                    {/* === POPUP === */}
                                    <ExcelImportMovies
                                        open={openImport}
                                        onClose={() => setOpenImport(false)}
                                        onImport={handleImport}
                                    />
                                </div>
                            )}
                            {activeTab === "movies" && (
                                <Button onClick={handleOpenAdd} className="px-4 py-2 bg-blue-600 text-white rounded">Thêm phim</Button>
                            )}
                            <div className="p-2 bg-white rounded shadow">Admin</div>
                        </div>
                    </header>

                    {activeTab === "dashboard" && (
                        <div className="grid grid-cols-3 gap-6">

                            <div className="col-span-3 mt-4 bg-white p-4 rounded shadow">
                                <h3 className="font-semibold mb-2">Gần đây</h3>
                                <p>Danh sách đặt vé mới nhất và thông tin nhanh.</p>
                            </div>
                        </div>
                    )}

                    {activeTab === "movies" && (
                        <div className="mt-4">
                            <MovieTable movies={movies} onDelete={handleDeleteFromChild} onEdit={handleEdit} />
                        </div>
                    )}

                    {activeTab === "bookings" && (
                        <div className="mt-4">
                            <BookingsTable bookings={bookings} />
                        </div>
                    )}

                    {activeTab === "showtimes" && (
                        <div className="mt-4 ">
                            <Showtimestable
                                showtimes={showtimes}
                                onSelect={(st) => console.log("chọn showtime", st)}
                                onCommit={handleCommit}
                            />
                        </div>
                    )}
                </>
                )}
            </main>

            {/* Movie Modal */}
            <AddOrEditMovieModal
                movie={editingMovie}
                open={editOpen}
                onClose={() => { setEditOpen(false); setEditingMovie(null); }}
                onSave={handleSave}
            />

        </div>

    );

}


