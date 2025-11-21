
"use client";

import React, { useEffect, useState } from "react";
import { getAllMovies } from "@/lib/axios/admin/movieAPI";
import { MovieFullITF } from "@/lib/interface/movieInterface";
import MovieTable from "@/components/MovieTable/MovieTable";
import BookingsTable from "@/components/BookingsTable/BookingsTable";
import Showtimestable from "@/components/ShowtimesTable/ShowtimesTable";
import Button from "@/components/Button/Button";
import AddOrEditMovieModal from "@/components/AddOrEditFormMovie/AddOrEditFormMovie";
import Swal from "sweetalert2";
import { getAllBookings } from "@/lib/axios/admin/bookingAPI";
import { getAllShowtimes } from "@/lib/axios/admin/showtimeAPI";
export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState("dashboard");
    const [movies, setMovies] = useState<MovieFullITF[]>([]);
    const [bookings, setBookings] = useState([]);
    const [showtimes, setShowtimes] = useState([]);

    // modal
    const [editOpen, setEditOpen] = useState(false);
    const [editingMovie, setEditingMovie] = useState<MovieFullITF | null>(null);

    // loading
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    // const [selectedMovie, setSelectedMovie] = useState(null);
    // const [showMovieModal, setShowMovieModal] = useState(false);
    // const [stats, setStats] = useState({ totalMovies: 0, totalBookings: 0, revenue: 0 });

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


    function handleEdit(movie: MovieFullITF) {
        console.log("Edit:", movie);
    }

    const handleDeleteFromChild = () => {
        // simplest: fetch lại danh sách
        fetchMovies();
        // hoặc: setMovies(prev => prev.filter(m => m.movie_id !== id));
    };
    // mở modal để thêm (movie = null)
    function handleOpenAdd() {
        setEditingMovie(null);
        setEditOpen(true);
    }

    // mở modal để sửa
    // function handleOpenEdit(movie: MovieFullITF) {
    //     setEditingMovie(movie);
    //     setEditOpen(true);
    // }
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
            <aside className="w-64 bg-white shadow-md p-6">
                <h2 className="text-xl font-semibold mb-6">Cinema Admin</h2>
                <nav className="space-y-2">
                    <button
                        onClick={() => setActiveTab("dashboard")}
                        className={`w-full text-left px-3 py-2 rounded-md ${activeTab === "dashboard" ? "bg-slate-100" : "hover:bg-slate-50"}`}
                    >
                        Dashboard
                    </button>
                    <button
                        onClick={() => setActiveTab("movies")}
                        className={`w-full text-left px-3 py-2 rounded-md ${activeTab === "movies" ? "bg-slate-100" : "hover:bg-slate-50"}`}
                    >
                        Movies
                    </button>
                    <button
                        onClick={() => setActiveTab("bookings")}
                        className={`w-full text-left px-3 py-2 rounded-md ${activeTab === "bookings" ? "bg-slate-100" : "hover:bg-slate-50"}`}
                    >
                        Bookings
                    </button>
                    <button
                        onClick={() => setActiveTab("showtimes")}
                        className={`w-full text-left px-3 py-2 rounded-md ${activeTab === "showtimes" ? "bg-slate-100" : "hover:bg-slate-50"}`}
                    >
                        Showtimes
                    </button>
                </nav>
            </aside>

            <main className="flex-1 p-8">
                <header className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold">{activeTab === "dashboard" ? "Dashboard" : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h1>
                    <div className="flex items-center gap-3">
                        {activeTab === "movies" && (
                            <Button onClick={handleOpenAdd} className="px-4 py-2 bg-blue-600 text-white rounded">Thêm phim</Button>
                        )}
                        <div className="p-2 bg-white rounded shadow">Admin</div>
                    </div>
                </header>

                {activeTab === "dashboard" && (
                    <div className="grid grid-cols-3 gap-6">
                        {/* <StatCard title="Phim" value={stats.totalMovies} />
                        <StatCard title="Đặt vé" value={stats.totalBookings} />
                        <StatCard title="Doanh thu" value={`${Number(stats.revenue).toLocaleString()} VND`} /> */}

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
                        />
                    </div>
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


