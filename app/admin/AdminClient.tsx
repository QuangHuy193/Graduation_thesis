
"use client";

import React, { useEffect, useState } from "react";
import { getAllMovies, callBulkApi, getAllMoviesEx } from "@/lib/axios/admin/movieAPI";
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
    const [moviesEx, setMoviesEx] = useState<MovieFullITF[]>([]);
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
            const dataEx = await getAllMoviesEx();
            setMovies(data);
            setMoviesEx(dataEx);
        } catch (e) {
            console.error(e);

            setMovies([]);
            setMoviesEx([]);
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

    function handleEdit() {
        fetchMovies();
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

            // Partition: those that already have server-id vs those that are temp (no server id)
            const withServerId = normalized.filter(x => {
                const u = x.u;
                return (typeof u?.showtime_id === "number" && u.showtime_id > 0)
                    || (typeof u?.id === "number" && u.id > 0); // fallback if client used `id`
            });
            const withoutServerId = normalized.filter(x => !withServerId.includes(x));

            // Step A: create all temp items (if any). We'll map tempId -> serverRow
            const tempMap = new Map<number, any>(); // tempId -> server row
            if (withoutServerId.length > 0) {

                // Create in sequence to avoid race conditions on unique constraints (you can change to Promise.all if safe)
                for (const item of withoutServerId) {
                    const u = item.u;
                    // Determine client's temp id (how you stored it). Common patterns: negative showtime_id or id
                    const tempId = Number(u.showtime_id ?? u.id ?? NaN);
                    if (!Number.isFinite(tempId)) {
                        console.warn("Skipping create: missing temp id on item", item);
                        continue;
                    }

                    // Build create payload consistent with your create API (we changed API to operate on `showtime`)
                    const createPayload = {
                        movie_id: u.movie_id ?? null,
                        room_id: u.room_id ?? null,
                        movie_screen_id: u.movie_screen_id ?? null,
                        date: u.date ?? u.show_date ?? null, // YYYY-MM-DD
                        reuse_showtime: false, // prefer to create a unique showtime for this temp slot
                        _temp_client_id: tempId,
                        status: typeof u.status === "number" ? u.status : (u.status === "active" ? 1 : 1),
                    };

                    const res = await createShowtimeWithDay(createPayload);
                    if (!res?.ok) {
                        // If create fails, bubble up so UI can handle conflict or other problems
                        const err: any = new Error(res?.message ?? "createShowtimeWithDay failed");
                        err.response = { data: res };
                        throw err;
                    }

                    // Expect server returns res.row with showtime_id (or id). Normalize it.
                    const serverRow = res.row ?? null;
                    if (!serverRow) {
                        console.warn("createShowtimeWithDay returned no row for tempId", tempId, res);
                        continue;
                    }

                    // Normalize serverRow to include showtime_id and date fields
                    const normalizedServerRow = {
                        ...serverRow,
                        showtime_id: Number(serverRow.showtime_id ?? serverRow.id ?? serverRow.insertId ?? NaN),
                        date: serverRow.date ?? serverRow.show_date ?? serverRow.showDate ?? createPayload.date,
                    };

                    if (!Number.isFinite(normalizedServerRow.showtime_id)) {
                        console.warn("Created server row has no showtime_id:", serverRow);
                    }

                    tempMap.set(tempId, normalizedServerRow);
                }
            }

            // Step B: build payloadMoves for commitShowtimeMoves
            // For each normalized move, prefer server id resolved from tempMap (if was temp), else use existing showtime_id
            const payloadMoves: any[] = normalized.map(({ pending, u }) => {
                // If temp and created, use created server id
                const clientTempId = Number(u.showtime_id ?? u.id ?? NaN);
                if (tempMap.has(clientTempId)) {
                    const server = tempMap.get(clientTempId);
                    return {
                        showtime_id: server.showtime_id,
                        date: server.date,
                        to_room: server.room_id ?? u.room_id ?? u.to_room ?? null,
                        to_movie_screen_id: server.movie_screen_id ?? u.movie_screen_id ?? u.movieScreenId ?? null,
                        movie_id: server.movie_id ?? u.movie_id ?? u.movieId ?? null,
                        status: 1,
                    };
                }

                // not a temp
                const stId = (typeof u.showtime_id === "number" && u.showtime_id > 0) ? u.showtime_id
                    : ((typeof u.id === "number" && u.id > 0) ? u.id : null);

                const date = u.date ?? u.show_date ?? u.showDate ?? null;


                return {
                    showtime_id: stId,
                    date,
                    to_room: u.room_id ?? u.to_room ?? null,
                    to_movie_screen_id: u.movie_screen_id ?? u.movieScreenId ?? null,
                    movie_id: u.movie_id ?? u.movieId ?? null,
                    status: u.status,
                };
            });

            // Filter out any moves that still don't have showtime_id (shouldn't happen but be defensive)
            const filteredPayload = payloadMoves.filter(pm => typeof pm.showtime_id === "number" && pm.showtime_id > 0);

            if (filteredPayload.length === 0) {
                Swal.fire({ icon: "warning", title: "Không có thay đổi để lưu", text: "Không có showtime_id hợp lệ để commit." });
                // Optionally refresh to canonical state
                await fetchShowtimes();
                return { ok: true, message: "No server-side moves to commit" };
            }

            // Step C: call commitShowtimeMoves to apply updates in batch
            const data = await commitShowtimeMoves(filteredPayload);
            if (!data?.ok) {
                const err: any = new Error(data?.message ?? "commitShowtimeMoves failed");
                err.response = { data };
                throw err;
            }

            Swal.fire({ icon: "success", title: "Thành công", timer: 1200, showConfirmButton: false });
            // Ensure canonical state
            await fetchShowtimes();
            return data;
        } catch (err: any) {
            console.error("Commit failed:", err);

            const api = err.response?.data ?? err;
            if (err.response?.status === 409 || api?.status === 409) {
                const conflict = api?.conflict;
                const msg = conflict
                    ? `Xung đột: phòng ${conflict.target_room} có suất chồng giờ (showtime ${conflict.conflicting?.showtime_id ?? conflict.conflicting?.id}).`
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
                                externalMovies={moviesEx}
                            // onAdd={async (payload) => {
                            //     // payload should include _temp_client_id when con gọi; forward it
                            //     const result = await createShowtimeWithDay(payload);
                            //     if (!result?.ok) throw new Error(result?.message ?? "create failed");
                            //     return result.row; // row nên chứa id (server id) và có thể _temp_client_id nếu server echo
                            // }}
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


