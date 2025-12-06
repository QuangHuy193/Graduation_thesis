
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
            setCinemasMap(payload);

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
            setCinemasMap({});
        }
    }

    async function fetchRooms() {
        try {
            const res = await getAllRooms();
            const payload = res?.data?.data ?? res?.data ?? res ?? [];
            setRoomsList(payload);

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

    const handleCommit = async (moves: PendingSlotUpdate[]) => {
        if (!moves || moves.length === 0) return;

        setLoading(true);
        try {
            // Normalize moves -> lấy updated object u
            const normalized = moves.map(m => ({ pending: m, u: m.updated as any }));

            // Separate creates vs updates:
            // - Create if not have server id and not have master showtime_id
            // - Update if have u.id > 0 (server id) OR u.showtime_id > 0 (master)
            const creates = normalized.filter(x => {
                const u = x.u;
                const hasServerId = typeof u?.id === "number" && u.id > 0;
                const hasMaster = typeof u?.showtime_id === "number" && u.showtime_id > 0;
                return !hasServerId && !hasMaster;
            });
            const updates = normalized.filter(x => {
                const u = x.u;
                const hasServerId = typeof u?.id === "number" && u.id > 0;
                const hasMaster = typeof u?.showtime_id === "number" && u.showtime_id > 0;
                return hasServerId || hasMaster;
            });

            // 1) Create all new showtimes (if any)
            const tempMap = new Map<number, any>(); // tempId -> serverRow
            if (creates.length > 0) {
                // Prepare create calls
                const createCalls = creates.map(async ({ u }) => {
                    // build payload for createShowtimeWithDay
                    const payload: any = {
                        movie_id: u.movie_id ?? null,
                        room_id: u.room_id ?? u.to_room ?? null,
                        movie_screen_id: u.movie_screen_id ?? u.movieScreenId ?? null,
                        show_date: u.show_date ?? u.showDate ?? null,
                        // send temp id so backend can echo it if supported
                        _temp_client_id: u.id ?? null,
                    };
                    if (u.start_time ?? u.screening_start) payload.screening_start = u.start_time ?? u.screening_start;
                    if (u.end_time ?? u.screening_end) payload.screening_end = u.end_time ?? u.screening_end;
                    if (typeof u.status === "string") payload.status = u.status;

                    // call create API (wrap with your existing wrapper createShowtimeWithDay)
                    const res = await createShowtimeWithDay(payload);
                    if (!res?.ok) {
                        const err: any = new Error(res?.message ?? "createShowtimeWithDay failed");
                        err.response = { data: res };
                        throw err;
                    }
                    // server row expected in res.row (adjust if your API returns differently)
                    const row = res.row ?? res;
                    return { tempId: u.id, serverRow: row };
                });

                // Run creates in parallel. If any throws, we go to catch.
                const created = await Promise.all(createCalls);

                // Fill tempMap
                for (const c of created) {
                    if (c?.tempId != null) tempMap.set(Number(c.tempId), c.serverRow);
                    else if (c?.serverRow?._temp_client_id != null) tempMap.set(Number(c.serverRow._temp_client_id), c.serverRow);
                }
            }

            // 2) Build payloadMoves for commitShowtimeMoves
            const payloadMoves: any[] = normalized.map(({ pending, u }) => {
                // If this was a temp we just created -> convert to showtime_day_id using tempMap
                const isTemp = !(typeof u?.id === "number" && u.id > 0) && !(typeof u?.showtime_id === "number" && u.showtime_id > 0);
                if (isTemp && tempMap.has(u.id)) {
                    const serverRow = tempMap.get(u.id);
                    return {
                        showtime_day_id: serverRow.id,
                        show_date: serverRow.show_date ?? serverRow.showDate ?? null,
                        to_room: serverRow.room_id ?? serverRow.to_room ?? null,
                        to_movie_screen_id: serverRow.movie_screen_id ?? serverRow.movieScreenId ?? null,
                        movie_id: serverRow.movie_id ?? null,
                        status: serverRow.status ?? "active",
                    };
                }

                // Existing or master upsert case (same logic bạn đang dùng)
                const common: any = {
                    show_date: u.show_date ?? u.showDate ?? null,
                    to_room: u.room_id ?? u.to_room ?? null,
                    to_movie_screen_id: u.movie_screen_id ?? u.movieScreenId ?? null,
                    movie_id: u.movie_id ?? u.movieId ?? null,
                    status: u.status ?? "active",
                };

                if (typeof u.id === "number" && u.id > 0) {
                    return { showtime_day_id: u.id, ...common };
                }

                if (typeof u.showtime_id === "number" && u.showtime_id > 0) {
                    return { showtime_id: u.showtime_id, ...common };
                }

                // Fallback: send as create-like payload with _temp_client_id (if backend supports)
                return {
                    showtime_id: null,
                    _temp_client_id: u.id ?? null,
                    ...common,
                    screening_start: u.start_time ?? u.screening_start,
                    screening_end: u.end_time ?? u.screening_end,
                };
            });

            // 3) Call commitShowtimeMoves with payloadMoves
            const data = await commitShowtimeMoves(payloadMoves);
            if (!data?.ok) {
                const err: any = new Error(data?.message ?? "move-batch failed");
                err.response = { data };
                throw err;
            }

            // 4) Merge response into client state (giống logic bạn có)
            const results = data.results ?? data.updated ?? data.rows ?? null;
            if (Array.isArray(results)) {
                setShowtimes((prev) => {
                    const prevMap = new Map<number, ShowtimeDay>();
                    for (const p of prev) prevMap.set(Number((p as any).id), p);

                    for (const r of results) {
                        const rid = Number(r.id ?? r.showtime_day_id ?? r.row_id ?? NaN);
                        if (Number.isFinite(rid)) {
                            prevMap.set(rid, { ...(prevMap.get(rid) ?? ({} as any)), ...(r as any) });
                        } else if (r._temp_client_id) {
                            const tempId = Number(r._temp_client_id);
                            for (const [k, v] of prevMap.entries()) {
                                if ((v as any).id === tempId) prevMap.delete(k);
                            }
                            const serverId = Number(r.id);
                            if (Number.isFinite(serverId)) prevMap.set(serverId, r as any);
                        }
                    }

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
                await fetchShowtimes();
            }

            Swal.fire({ icon: "success", title: "Commit thành công", timer: 1200, showConfirmButton: false });
            await fetchShowtimes();
            return data;
        } catch (err: any) {
            console.error("Commit failed:", err);

            // Optional: cleanup created rows if commit failed
            // if (tempMap && tempMap.size > 0) {
            //   // if you have delete API: await Promise.all([...tempMap.values()].map(r => deleteShowtime(r.id)));
            // }

            const api = err.response?.data ?? err;
            if (err.response?.status === 409 || api?.status === 409) {
                const conflict = api?.conflict;
                const msg = conflict
                    ? `Xung đột: phòng ${conflict.target_room} có suất chồng giờ (showtime ${conflict.conflicting_show?.id ?? conflict.conflicting_show?.showtime_id}).`
                    : "Xung đột khi lưu — có suất chồng giờ.";
                Swal.fire({ icon: "error", title: "Commit thất bại", text: msg });
            } else {
                Swal.fire({ icon: "error", title: "Lỗi", text: api?.message ?? "Không thể lưu thay đổi." });
            }

            throw err;
        } finally {
            setLoading(false);
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
        setLoading(true);
        try {
            await fetchMovies();
        } catch (err) {
            console.error("save movie error:", err);
            // alert("Lưu phim thất bại. Kiểm tra console để biết chi tiết.");
            Swal.fire("Lưu phim thất bại. Kiểm tra console để biết chi tiết.");
        } finally {
            setLoading(false);
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
                                onCommit={handleCommit}
                                cinemasMap={cinemasMap}
                                roomsList={roomsList}
                                movieScreenings={screenings}
                                externalMovies={movies}
                                onAdd={async (payload) => {
                                    // payload should include _temp_client_id when con gọi; forward it
                                    const result = await createShowtimeWithDay(payload);
                                    if (!result?.ok) throw new Error(result?.message ?? "create failed");
                                    return result.row; // row nên chứa id (server id) và có thể _temp_client_id nếu server echo
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


