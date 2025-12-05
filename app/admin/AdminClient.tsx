
"use client";

import React, { useEffect, useState } from "react";
import { getAllMovies, callBulkApi } from "@/lib/axios/admin/movieAPI";
import { MovieFullITF } from "@/lib/interface/movieInterface";
import MovieTable from "@/components/MovieTable/MovieTable";
import BookingsTable from "@/components/BookingsTable/BookingsTable";
import Showtimestable, { CinemaEntry, RoomEntry, ShowtimeDay } from "@/components/ShowtimesTable/ShowtimesTable";
import Button from "@/components/Button/Button";
import AddOrEditMovieModal from "@/components/AddOrEditFormMovie/AddOrEditFormMovie";
import Swal from "sweetalert2";
import { getAllBookings } from "@/lib/axios/admin/bookingAPI";
import { commitShowtimeMoves, getAllShowtimeDay, createShowtimeWithDay } from "@/lib/axios/admin/showtimeAPI";
import { getAllRooms } from "@/lib/axios/admin/roomAPI";
import { getAllCinemas } from "@/lib/axios/admin/cinemaAPI";
import { getScreenings } from "@/lib/axios/admin/movie_screenAPI";
import ExcelImportMovies from "@/components/ExcelImportMovies/ExcelImportMovies";
import Spinner from "@/components/Spinner/Spinner";

type PendingSlotUpdate = {
    showtime_day_id: number;
    from_slot: number | null;
    to_slot: number;
    updated: ShowtimeDay;
};

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState("dashboard");
    const [movies, setMovies] = useState<MovieFullITF[]>([]);
    const [bookings, setBookings] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [cinemas, setCinemas] = useState([]);
    const [screenings, setScreenings] = useState([]);
    const [showtimes, setShowtimes] = useState<ShowtimeDay[]>([]);
    const [openImport, setOpenImport] = useState(false);
    const [cinemasMap, setCinemasMap] = React.useState<Record<number, CinemaEntry>>({});
    const [roomsList, setRoomsList] = React.useState<RoomEntry[]>([]);
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
        fetchCinemas();
        fetchRooms();
        fetchScreenings();
    }, []);
    useEffect(() => {
        console.log("DEBUG showtimes:", showtimes);
        console.log("DEBUG movieScreenings:", screenings);
    }, [showtimes, screenings]);

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
    async function fetchScreenings() {
        try {
            const data = await getScreenings();
            setScreenings(data);
        } catch (e) {
            console.error(e);
            // fallback: mock
            setScreenings([]);
        }
    }
    async function fetchCinemas() {
        try {
            const res = await getAllCinemas();
            const payload = res?.data?.data ?? res?.data ?? res ?? [];
            setCinemas(payload);

            // build map immediately
            const cMap: Record<number, CinemaEntry> = {};
            for (const c of payload) {
                const id = Number(c.cinema_id);
                if (!Number.isFinite(id)) continue;
                cMap[id] = { cinema_id: id, name: c.name ?? undefined };
            }
            setCinemasMap(cMap);
        } catch (e) {
            console.error(e);
            setCinemas([]);
            setCinemasMap({});
        }
    }

    async function fetchRooms() {
        try {
            const res = await getAllRooms();
            const payload = res?.data?.data ?? res?.data ?? res ?? [];
            setRooms(payload);

            const rList: RoomEntry[] = payload
                .map((r: any) => ({
                    room_id: Number(r.room_id),
                    name: r.name ?? undefined,
                    cinema_id: r.cinema_id == null ? null : Number(r.cinema_id),
                }))
                .filter((r) => Number.isFinite(r.room_id));
            setRoomsList(rList);
        } catch (e) {
            console.error(e);
            setRooms([]);
            setRoomsList([]);
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
            const payload = await getAllShowtimeDay();
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
    const handleCommit = async (moves: PendingSlotUpdate[]) => {
        if (!moves || moves.length === 0) return;

        setSaving(true);
        try {
            // Build payload.moves based on each pending change
            const payloadMoves: any[] = moves.map((m) => {
                const u = m.updated;

                // If this is an existing persisted showtime_day (positive id) -> update by showtime_day_id
                if (u.id > 0) {
                    return {
                        showtime_day_id: u.id,
                        to_room: u.room_id ?? null,
                        to_movie_screen_id: u.movie_screen_id ?? null,
                        movie_id: u.movie_id ?? null,
                        status: (u as any).status ?? "active",
                    };
                }

                // Else: temp/new item (id negative). Prefer to upsert by showtime_id + show_date if we have showtime_id.
                // NOTE: ideally u.showtime_id should be a valid "master" showtime id. If not available, we cannot upsert reliably.
                if (typeof u.showtime_id === "number" && u.showtime_id > 0) {
                    return {
                        showtime_id: u.showtime_id,
                        show_date: u.show_date,
                        to_room: u.room_id ?? null,
                        to_movie_screen_id: u.movie_screen_id ?? null,
                        movie_id: u.movie_id ?? null,
                        status: (u as any).status ?? "active",
                    };
                }

                // No valid showtime_id: fallback — include show_date + movie_id + room/slot and mark that showtime_id is missing.
                // Backend must support creation without showtime_id or you should create the master showtime before commit.
                return {
                    // We'll include showtime_id: null to indicate creation without master id (backend must accept this).
                    showtime_id: null,
                    show_date: u.show_date,
                    to_room: u.room_id ?? null,
                    to_movie_screen_id: u.movie_screen_id ?? null,
                    movie_id: u.movie_id ?? null,
                    status: (u as any).status ?? "active",
                    _temp_client_id: u.id, // include client temp id so we can map response back if backend echoes this field
                };
            });

            // Call your wrapper (commitShowtimeMoves) — ensure it sends { moves } to /api/showtimes/move-batch
            const res = await commitShowtimeMoves({ moves: payloadMoves });

            // Normalize response: server may return { ok: true, results: [...] } or { ok: true, updated: [...] }
            const data = res?.data ?? res ?? {};
            const results = data.results ?? data.updated ?? data.rows ?? null;

            if (Array.isArray(results)) {
                // Merge server rows into local showtimes
                // server row field for primary key is assumed to be `id` (showtime_days.id)
                setShowtimes((prev) => {
                    // convert prev to map by id for faster merge
                    const prevMap = new Map<number, ShowtimeDay>();
                    for (const p of prev) prevMap.set(Number((p as any).id), p);

                    // For any server row:
                    for (const r of results) {
                        const rid = Number(r.id ?? r.showtime_day_id ?? r.row_id ?? NaN);
                        if (Number.isFinite(rid)) {
                            prevMap.set(rid, { ...(prevMap.get(rid) ?? ({} as any)), ...(r as any) });
                        } else if (r._temp_client_id) {
                            // server echoed our temp id mapping: replace temp id entry
                            const tempId = Number(r._temp_client_id);
                            // remove old temp entry and insert new one with server id
                            prevMap.forEach((v, k) => {
                                if (v.id === tempId) prevMap.delete(k);
                            });
                            const serverId = Number(r.id);
                            if (Number.isFinite(serverId)) prevMap.set(serverId, r as any);
                        }
                    }

                    // return array from map (preserve sort by date/room/slot)
                    const out = Array.from(prevMap.values());
                    out.sort((a, b) => {
                        if (a.show_date < b.show_date) return -1;
                        if (a.show_date > b.show_date) return 1;
                        if (a.room_id < b.room_id) return -1;
                        if (a.room_id > b.room_id) return 1;
                        return (a.movie_screen_id ?? -1) - (b.movie_screen_id ?? -1);
                    });
                    return out;
                });
            } else {
                // fallback: refresh from server
                await fetchShowtimes();
            }

            Swal.fire({ icon: "success", title: "Commit thành công", timer: 1200, showConfirmButton: false });
            return res;
        } catch (err: any) {
            console.error("Commit failed:", err);

            const api = err.response?.data ?? err;
            if (err.response?.status === 409) {
                const conflict = api?.conflict;
                const msg = conflict
                    ? `Xung đột: phòng ${conflict.target_room} có suất chồng giờ (showtime ${conflict.conflicting_show?.id ?? conflict.conflicting_show?.showtime_id}).`
                    : "Xung đột khi lưu — có suất chồng giờ.";
                Swal.fire({ icon: "error", title: "Commit thất bại", text: msg });
            } else {
                Swal.fire({ icon: "error", title: "Lỗi", text: api?.message ?? "Không thể lưu thay đổi." });
            }

            // rethrow để component con rollback nếu cần
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
                                cinemasMap={cinemasMap}
                                roomsList={roomsList}
                                movieScreenings={screenings}
                                externalMovies={movies}
                                onAdd={async ({ movie_id, room_id, movie_screen_id, show_date }) => {
                                    // include _temp_client_id if you want mapping
                                    const result = await createShowtimeWithDay({
                                        movie_id,
                                        room_id,
                                        movie_screen_id,
                                        show_date,
                                        _temp_client_id: undefined // parent will pass this in from component; see below
                                    });
                                    // API returns { ok: true, row: { ... , _temp_client_id } }
                                    if (!result?.ok) throw new Error(result?.message ?? "create failed");
                                    return result.row;
                                }}
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


