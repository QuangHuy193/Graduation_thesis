"use client";

import React, { useEffect, useState } from "react";
import { getAllMovies } from "@/lib/axios/admin/movieAPI";
import { MovieFullITF } from "@/lib/interface/movieInterface";
import MovieTable from "@/components/MovieTable/MovieTable";
import Button from "@/components/Button/Button";
import AddOrEditMovieModal from "@/components/AddOrEditFormMovie/AddOrEditFormMovie";
export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState("dashboard");
    const [movies, setMovies] = useState<MovieFullITF[]>([]);
    const [bookings, setBookings] = useState([]);

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
    function handleEdit(movie: MovieFullITF) {
        console.log("Edit:", movie);
    }

    // Khi bấm nút Xóa
    // async function handleDelete(id: number) {
    //     // if (!confirm("Xác nhận xóa phim này?")) return;
    //     // setDeletingId(id);
    //     // try {
    //     //     const res = await fetch(`/api/admin/movies/${id}`, {
    //     //         method: "DELETE",
    //     //     });
    //     //     if (!res.ok) throw new Error(`Delete failed (${res.status})`);
    //     //     await fetchMovies();
    //     // } catch (err) {
    //     //     console.error("delete movie error:", err);
    //     //     alert("Xóa thất bại. Kiểm tra console để biết chi tiết.");
    //     // } finally {
    //     //     setDeletingId(null);
    //     // }
    //     console.log("Xóa");
    // }

    // mở modal để thêm (movie = null)
    function handleOpenAdd() {
        setEditingMovie(null);
        setEditOpen(true);
    }

    // mở modal để sửa
    function handleOpenEdit(movie: MovieFullITF) {
        setEditingMovie(movie);
        setEditOpen(true);
    }
    async function handleSave(movie: MovieFullITF) {
        setSaving(true);
        try {
            // nếu có movie_id > 0 -> update, ngược lại create
            if (movie.movie_id && Number(movie.movie_id) > 0) {
                const id = movie.movie_id;
                const res = await fetch(`/api/admin/movies/${id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(movie),
                });
                if (!res.ok) throw new Error(`Update failed (${res.status})`);
            } else {
                // create new
                const res = await fetch(`/api/admin/movies`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(movie),
                });
                if (!res.ok) throw new Error(`Create failed (${res.status})`);
            }

            // reload list
            await fetchMovies();
        } catch (err) {
            console.error("save movie error:", err);
            alert("Lưu phim thất bại. Kiểm tra console để biết chi tiết.");
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
                        <MovieTable movies={movies} />
                    </div>
                )}

                {activeTab === "bookings" && (
                    <div className="mt-4">
                        <BookingsTable bookings={bookings} />
                    </div>
                )}

                {activeTab === "showtimes" && (
                    <div className="mt-4 bg-white p-4 rounded shadow">
                        <h3 className="font-semibold mb-2">Quản lý suất chiếu</h3>
                        <p>Ở đây bạn có thể thêm, sửa, xóa suất chiếu cho từng phim.</p>
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
            movie modal
        </div>
    );
}

// function StatCard({ title, value }) {
//     return (
//         <div className="bg-white p-4 rounded shadow flex flex-col">
//             <span className="text-sm text-slate-500">{title}</span>
//             <span className="text-2xl font-bold mt-2">{value}</span>
//         </div>
//     );
// }


function BookingsTable({ bookings = [] }) {
    return (
        <div className="bg-white rounded shadow p-4">
            <table className="w-full table-auto">
                <thead className="bg-slate-50">
                    <tr>
                        <th className="text-left px-4 py-3">Mã</th>
                        <th className="text-left px-4 py-3">Phim</th>
                        <th className="text-left px-4 py-3">Ghế</th>
                        <th className="text-left px-4 py-3">Giá</th>
                        <th className="text-left px-4 py-3">Khách</th>
                    </tr>
                </thead>
                <tbody>
                    {/* {bookings.map((b) => (
                        <tr key={b.id} className="border-t">
                            <td className="px-4 py-3">{b.id}</td>
                            <td className="px-4 py-3">{b.movieTitle}</td>
                            <td className="px-4 py-3">{b.seats.join(", ")}</td>
                            <td className="px-4 py-3">{b.price.toLocaleString()} VND</td>
                            <td className="px-4 py-3">{b.customerName}</td>
                        </tr>
                    ))} */}
                </tbody>
            </table>

        </div>

    );

}

// function MovieModal({ movie, onClose }) {
//     const isEdit = Boolean(movie);
//     const [title, setTitle] = useState(movie?.title || "");
//     const [duration, setDuration] = useState(movie?.duration || 90);
//     const [rating, setRating] = useState(movie?.rating || "PG");
//     const [poster, setPoster] = useState(movie?.poster || "");

//     async function save(e) {
//         e.preventDefault();
//         const payload = { title, duration: Number(duration), rating, poster };
//         try {
//             const res = await fetch(isEdit ? `/api/admin/movies/${movie.id}` : "/api/admin/movies", {
//                 method: isEdit ? "PUT" : "POST",
//                 headers: { "Content-Type": "application/json" },
//                 body: JSON.stringify(payload),
//             });
//             if (!res.ok) throw new Error("Save failed");
//             onClose();
//         } catch (err) {
//             console.error(err);
//             alert("Lưu thất bại");
//         }
//     }

// return (
//     <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-40">
//         <div className="bg-white rounded-lg w-[640px] p-6">
//             <h3 className="text-xl font-semibold mb-4">{isEdit ? "Sửa phim" : "Thêm phim"}</h3>
//             <form onSubmit={save} className="space-y-3">
//                 <div>
//                     <label className="block text-sm">Tiêu đề</label>
//                     <input value={} onChange={(e) => setTitle()} className="w-full border rounded px-3 py-2" />
//                 </div>
//                 <div className="flex gap-3">
//                     <div className="flex-1">
//                         <label className="block text-sm">Thời lượng (phút)</label>
//                         <input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} className="w-full border rounded px-3 py-2" />
//                     </div>
//                     <div className="w-40">
//                         <label className="block text-sm">Rating</label>
//                         <input value={rating} onChange={(e) => setRating(e.target.value)} className="w-full border rounded px-3 py-2" />
//                     </div>
//                 </div>
//                 <div>
//                     <label className="block text-sm">Poster (URL)</label>
//                     <input value={poster} onChange={(e) => setPoster(e.target.value)} className="w-full border rounded px-3 py-2" />
//                 </div>

//                 <div className="flex justify-end gap-2 mt-4">
//                     <button type="button" onClick={onClose} className="px-4 py-2 rounded border">Hủy</button>
//                     <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white">Lưu</button>
//                 </div>
//             </form>
//         </div>
//     </div>
// );
// }

/*
  --- Backend example (Node.js + Express) ---

  // server/routes/admin.js
  const express = require('express');
  const router = express.Router();

  // Example in-memory stores (replace with DB)
  let movies = [ { id: '1', title: 'Sample', duration: 100, rating: 'PG' } ];
  let bookings = [];

  router.get('/movies', (req, res) => res.json(movies));
  router.post('/movies', (req, res) => {
    const id = String(Date.now());
    const movie = { id, ...req.body };
    movies.push(movie);
    res.status(201).json(movie);
  });
  router.put('/movies/:id', (req, res) => {
    const { id } = req.params;
    movies = movies.map(m => m.id === id ? { ...m, ...req.body } : m);
    res.json({ ok: true });
  });
  router.delete('/movies/:id', (req, res) => {
    const { id } = req.params;
    movies = movies.filter(m => m.id !== id);
    res.json({ ok: true });
  });

  router.get('/bookings', (req, res) => res.json(bookings));
  router.get('/stats', (req, res) => res.json({ totalMovies: movies.length, totalBookings: bookings.length, revenue: bookings.reduce((s,b)=>s+(b.price||0),0) }));

  module.exports = router;

  // In your server entry (app.js)
  // const adminRoutes = require('./server/routes/admin');
  // app.use('/api/admin', adminRoutes);

  -------------------------------------------------

  NOTES & NEXT STEPS
  - Đây là template front-end. Bạn cần triển khai các API endpoint (GET/POST/PUT/DELETE) trên backend.
  - Kết nối DB (MySQL/Postgres/Mongo) thay cho dữ liệu in-memory.
  - Thêm xác thực (JWT / session) cho route /admin.
  - Thêm upload poster (S3 / Cloudinary) nếu muốn upload file.

  Nếu bạn muốn, mình có thể: 
  - Viết sẵn các route backend tương thích (Express + Sequelize / Prisma) cho MySQL/Postgres.
  - Chuyển component này thành các component nhỏ hơn (file riêng).
  - Thêm charts cho doanh thu (recharts) hoặc export reports (CSV/PDF).

*/
