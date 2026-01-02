"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  getAllMovies,
  callBulkApi,
  getAllMoviesEx,
} from "@/lib/axios/admin/movieAPI";
import { MovieFullITF } from "@/lib/interface/movieInterface";
import MovieTable from "@/components/MovieTable/MovieTable";
import BookingsTable from "@/components/BookingsTable/BookingsTable";
import PromotionTable, {
  PromotionRule,
} from "@/components/PromotionTable/PromotionTable";
import { getAllPromotions } from "@/lib/axios/admin/promotion_ruleAPI";
import Showtimestable, {
  CinemaEntry,
  RoomEntry,
  ShowtimeDay,
} from "@/components/ShowtimesTable/ShowtimesTable";
import Button from "@/components/Button/Button";
import AddOrEditMovieModal from "@/components/AddOrEditFormMovie/AddOrEditFormMovie";
import Swal from "sweetalert2";
import { getAllBookings } from "@/lib/axios/admin/bookingAPI";
import {
  commitShowtimeMoves,
  getAllShowtimeDay,
  createShowtimeWithDay,
} from "@/lib/axios/admin/showtimeAPI";
import { getAllRooms } from "@/lib/axios/admin/roomAPI";
import { getAllCinemas } from "@/lib/axios/admin/cinemaAPI";
import { getScreenings } from "@/lib/axios/admin/movie_screenAPI";
import { getAllUsers } from "@/lib/axios/admin/userAPI";
import ExcelImportMovies from "@/components/ExcelImportMovies/ExcelImportMovies";
import Spinner from "@/components/Spinner/Spinner";
import RoomList from "@/components/RoomList/RoomList";
import DiagramRoom from "@/components/RoomList/DiagramRoom";
import UserTable from "@/components/UserTable/UserTable";
import { UserITF } from "@/lib/interface/userInterface";
import Dashboard from "@/components/Dashboard/Dashboard";
import {
  getAdminDashboardStats,
  getAdminDashboardWarnings,
} from "@/lib/axios/admin/dashboardAPI";
import {
  DashboardStats,
  DashboardWarnings,
} from "@/lib/interface/dashboardInterface";
import CinemaList from "@/components/CinemaList/CinemaList";
import MovieScreening from "@/components/CinemaList/MovieScreening";
import QrScanner from "@/components/QrScanner/QrScanner";
export type PendingSlotUpdate = {
  showtime_day_id: number;
  from_slot: number | null;
  to_slot: number;
  updated: ShowtimeDay;
};

type AdminTab =
  | "dashboard"
  | "users"
  | "movies"
  | "bookings"
  | "showtimes"
  | "rooms"
  | "scanner"
  | "promotions"
  | "aside"
  | "moviescreen"
  | "cinemas";

export default function AdminDashboard() {
  //Chọn tab quản lý
  const [activeTab, setActiveTab] = useState<AdminTab>(() => {
    if (typeof window !== "undefined") {
      return (
        (sessionStorage.getItem("admin_active_tab") as AdminTab) || "dashboard"
      );
    }
    return "dashboard";
  });
  //Lấy toàn bộ phim
  const [movies, setMovies] = useState<MovieFullITF[]>([]);
  //Lấy phim đang chiếu
  const [moviesEx, setMoviesEx] = useState<MovieFullITF[]>([]);
  //Lấy đặt vé
  const [bookings, setBookings] = useState([]);
  //Lấy khuyến mãi
  const [promotions, setPromotions] = useState<PromotionRule[]>([]);
  //Lấy khung giờ chiếu
  const [screenings, setScreenings] = useState([]);
  //Lấy suất chiếu
  const [showtimes, setShowtimes] = useState<ShowtimeDay[]>([]);
  //Lấy người dùng
  const [users, setUsers] = useState<UserITF[]>([]);
  //Mở excel
  const [openImport, setOpenImport] = useState(false);
  //Lấy danh sách rạp
  const [cinemasMap, setCinemasMap] = React.useState<
    Record<number, CinemaEntry>
  >({});
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(
    null
  );
  const [dashboardWarnings, setDashboardWarnings] =
    useState<DashboardWarnings | null>(null);
  const [roomsList, setRoomsList] = React.useState<RoomEntry[]>([]);
  // sửa thêm phòng
  const [room, setRoom] = useState();
  const [cinemaId, setCinemaId] = useState(-1);
  // modal
  const [editOpen, setEditOpen] = useState(false);
  const [editingMovie, setEditingMovie] = useState<MovieFullITF | null>(null);
  // loading
  const [loading, setLoading] = useState(false);

  const loaded = useRef({
    dashboard: false,
    movies: false,
    promotions: false,
    bookings: false,
    showtimes: false,
    rooms: false,
    users: false,
  });
  async function fetchShowtimeBundle() {
    setLoading(true);
    try {
      await Promise.all([
        fetchShowtimes(),
        fetchCinemas(),
        fetchRooms(),
        fetchScreenings(),
        fetchMovies(),
      ]);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    sessionStorage.setItem("admin_active_tab", activeTab);
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "dashboard") {
      fetchDashboardStats();
      fetchDashboardWarnings();
    }
    if (activeTab === "movies" && !loaded.current.movies) {
      fetchMovies();
      loaded.current.movies = true;
    }

    if (activeTab === "bookings" && !loaded.current.bookings) {
      fetchBookings();
      loaded.current.bookings = true;
    }
    if (activeTab === "showtimes" && !loaded.current.showtimes) {
      fetchShowtimeBundle();
      loaded.current.showtimes = true;
      loaded.current.movies = true;
    }

    if (activeTab === "promotions" && !loaded.current.promotions) {
      fetchPromotion();
      loaded.current.promotions = true;
    }
    if (activeTab === "users" && !loaded.current.users) {
      fetchUser();
      loaded.current.users = true;
    }
  }, [activeTab]);

  async function fetchUser() {
    try {
      const data = await getAllUsers();
      setUsers(data);
    } catch (error) {
      console.log(error);
      setUsers([]);
    }
  }
  async function fetchPromotion() {
    try {
      const data = await getAllPromotions();
      setPromotions(data);
    } catch (error) {
      console.error(error);
      setPromotions([]);
    }
  }
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
      // console.error(e);
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
  const fetchDashboardWarnings = async () => {
    const res = await getAdminDashboardWarnings();
    setDashboardWarnings(res.data.data);
  };
  const fetchDashboardStats = async () => {
    const res = await getAdminDashboardStats();
    setDashboardStats(res.data.data);
  };
  function handleReloadBooking() {
    fetchBookings();
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
  function handleEditUser() {
    fetchUser();
  }
  function handleEditMovie() {
    fetchMovies();
  }
  function handleEditPromotion() {
    fetchPromotion();
  }
  const handleDeleteFromChild = () => {
    fetchMovies();
  };

  const handleCommit = async (moves: PendingSlotUpdate[]) => {
    if (!moves || moves.length === 0) return;

    setLoading(true);
    try {
      // Normalize moves -> lấy updated object u
      const normalized = moves.map((m) => ({
        pending: m,
        u: m.updated as any,
      }));

      // Partition: those that already have server-id vs those that are temp (no server id)
      const withServerId = normalized.filter((x) => {
        const u = x.u;
        return (
          (typeof u?.showtime_id === "number" && u.showtime_id > 0) ||
          (typeof u?.id === "number" && u.id > 0)
        ); // fallback if client used `id`
      });
      const withoutServerId = normalized.filter(
        (x) => !withServerId.includes(x)
      );

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
            status:
              typeof u.status === "number"
                ? u.status
                : u.status === "active"
                  ? 1
                  : 1,
          };

          const res = await createShowtimeWithDay(createPayload);
          if (!res?.ok) {
            // If create fails, bubble up so UI can handle conflict or other problems
            const err: any = new Error(
              res?.message ?? "createShowtimeWithDay failed"
            );
            err.response = { data: res };
            throw err;
          }

          // Expect server returns res.row with showtime_id (or id). Normalize it.
          const serverRow = res.row ?? null;
          if (!serverRow) {
            console.warn(
              "createShowtimeWithDay returned no row for tempId",
              tempId,
              res
            );
            continue;
          }

          // Normalize serverRow to include showtime_id and date fields
          const normalizedServerRow = {
            ...serverRow,
            showtime_id: Number(
              serverRow.showtime_id ?? serverRow.id ?? serverRow.insertId ?? NaN
            ),
            date:
              serverRow.date ??
              serverRow.show_date ??
              serverRow.showDate ??
              createPayload.date,
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
            to_movie_screen_id:
              server.movie_screen_id ??
              u.movie_screen_id ??
              u.movieScreenId ??
              null,
            movie_id: server.movie_id ?? u.movie_id ?? u.movieId ?? null,
            status: 1,
          };
        }

        // not a temp
        const stId =
          typeof u.showtime_id === "number" && u.showtime_id > 0
            ? u.showtime_id
            : typeof u.id === "number" && u.id > 0
              ? u.id
              : null;

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
      const filteredPayload = payloadMoves.filter(
        (pm) => typeof pm.showtime_id === "number" && pm.showtime_id > 0
      );

      if (filteredPayload.length === 0) {
        Swal.fire({
          icon: "warning",
          title: "Không có thay đổi để lưu",
          text: "Không có showtime_id hợp lệ để commit.",
        });
        // Optionally refresh to canonical state
        await fetchShowtimes();
        return { ok: true, message: "No server-side moves to commit" };
      }

      // Step C: call commitShowtimeMoves to apply updates in batch
      const data = await commitShowtimeMoves(filteredPayload);
      if (!data?.ok) {
        const err: any = new Error(
          data?.message ?? "commitShowtimeMoves failed"
        );
        err.response = { data };
        throw err;
      }

      Swal.fire({
        icon: "success",
        title: "Thành công",
        timer: 1200,
        showConfirmButton: false,
      });
      // Ensure canonical state
      await fetchShowtimes();
      return data;
    } catch (err: any) {
      console.error("Commit failed:", err);

      const api = err.response?.data ?? err;
      if (err.response?.status === 409 || api?.status === 409) {
        const conflict = api?.conflict;
        const msg = conflict
          ? `Xung đột: phòng ${conflict.target_room
          } có suất chồng giờ (showtime ${conflict.conflicting?.showtime_id ?? conflict.conflicting?.id
          }).`
          : "Xung đột khi lưu — có suất chồng giờ.";
        Swal.fire({ icon: "error", title: "Commit thất bại", text: msg });
      } else {
        Swal.fire({
          icon: "error",
          title: "Lỗi",
          text: api?.message ?? "Không thể lưu thay đổi.",
        });
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
    bookings: "Đặt vé",
    promotions: "Sự kiện",
    cinemas: "Danh sách rạp",
    moviescreen: "Khung giờ chiếu",
    rooms: "Danh sách phòng theo rạp",
    aside: "Danh sách phòng - Sơ đồ phòng",
    users: "Người dùng",
    scanner: "Quét mã vé",
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
            className={`w-full text-left px-3 py-2 cursor-pointer rounded-md ${activeTab === "dashboard" ? "bg-slate-100" : "hover:bg-slate-50"
              }`}
          >
            Tổng quan
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`w-full text-left px-3 py-2 cursor-pointer rounded-md ${activeTab === "users" ? "bg-slate-100" : "hover:bg-slate-50"
              }`}
          >
            Quản lý thành viên
          </button>
          <button
            onClick={() => setActiveTab("movies")}
            className={`w-full text-left px-3 py-2 cursor-pointer rounded-md ${activeTab === "movies" ? "bg-slate-100" : "hover:bg-slate-50"
              }`}
          >
            Quản lý phim
          </button>
          <button
            onClick={() => setActiveTab("bookings")}
            className={`w-full text-left px-3 py-2 cursor-pointer rounded-md ${activeTab === "bookings" ? "bg-slate-100" : "hover:bg-slate-50"
              }`}
          >
            Quản lý đặt vé
          </button>
          <button
            onClick={() => setActiveTab("showtimes")}
            className={`w-full text-left px-3 py-2 cursor-pointer rounded-md ${activeTab === "showtimes" ? "bg-slate-100" : "hover:bg-slate-50"
              }`}
          >
            Quản lý suất chiếu
          </button>
          <button
            onClick={() => setActiveTab("cinemas")}
            className={`w-full text-left px-3 py-2 cursor-pointer rounded-md ${activeTab === "cinemas" ? "bg-slate-100" : "hover:bg-slate-50"
              }`}
          >
            Quản lý rạp
          </button>
          <button
            onClick={() => setActiveTab("rooms")}
            className={`w-full text-left px-3 py-2 cursor-pointer rounded-md ${activeTab === "rooms" ? "bg-slate-100" : "hover:bg-slate-50"
              }`}
          >
            Quản lý phòng
          </button>
          <button
            onClick={() => setActiveTab("scanner")}
            className={`w-full text-left px-3 py-2 cursor-pointer rounded-md ${activeTab === "scanner" ? "bg-slate-100" : "hover:bg-slate-50"
              }`}
          >
            Quét mã vé
          </button>
          <button
            onClick={() => setActiveTab("promotions")}
            className={`w-full text-left px-3 py-2 cursor-pointer rounded-md ${activeTab === "promotions" ? "bg-slate-100" : "hover:bg-slate-50"
              }`}
          >
            Sự kiện & CTKM
          </button>
        </nav>
      </aside>

      <main className="flex-1 p-8">
        {loading ? (
          <div className="py-10 flex justify-center">
            <Spinner text="Đang xử lý..." />
          </div>
        ) : (
          <>
            <header className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold">
                {TAB_TITLES[activeTab] ?? "Không xác định"}
              </h1>
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
                  <Button
                    onClick={handleOpenAdd}
                    className="px-4 py-2 bg-blue-600 text-white rounded"
                  >
                    Thêm phim
                  </Button>
                )}
                <div className="p-2 bg-white rounded shadow">Quản trị viên</div>
              </div>
            </header>

            {activeTab === "dashboard" && (
              <div className="mt-4">
                {/* <div className="col-span-3 mt-4 bg-white p-4 rounded shadow">
                  <h3 className="font-semibold mb-2">Gần đây</h3>
                  <p>Tổng quan trạng thái và thống kê doanh thu tuần qua.</p>
                </div> */}
                <Dashboard
                  stats={dashboardStats}
                  warnings={dashboardWarnings}
                />
              </div>
            )}

            {activeTab === "moviescreen" && (
              <div className="mt-4">
                <MovieScreening setActiviTab={(name) => setActiveTab(name)} />
              </div>
            )}

            {activeTab === "cinemas" && (
              <div className="mt-4">
                <CinemaList setActiviTab={(name) => setActiveTab(name)} />
              </div>
            )}

            {activeTab === "rooms" && (
              <div className="mt-4">
                <RoomList
                  setToggleRoom={(path) => setActiveTab(path)}
                  setRoom={(r) => setRoom(r)}
                  setCinemaId={setCinemaId}
                  setActiviTab={(name) => setActiveTab(name)}
                />
              </div>
            )}

            {activeTab === "aside" && (
              <div className="mt-4">
                <DiagramRoom
                  cinemaId={cinemaId}
                  room={room}
                  setToggleRoom={(path) => setActiveTab(path)}
                />
              </div>
            )}

            {activeTab === "scanner" && (
              <div className="mt-4">
                <QrScanner />
              </div>
            )}

            {activeTab === "movies" && (
              <div className="mt-4">
                <MovieTable
                  movies={movies}
                  onDelete={handleDeleteFromChild}
                  onEdit={handleEditMovie}
                />
              </div>
            )}

            {activeTab === "bookings" && (
              <div className="mt-4">
                <BookingsTable bookings={bookings} onUpdateRefund={handleReloadBooking} />
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
                  onBulkApplied={fetchShowtimes}
                  onLoadingChange={setLoading}
                  onSuccess={(msg?: string) =>
                    Swal.fire({
                      icon: "success",
                      title: msg ?? "Thành công",
                      timer: 1200,
                      showConfirmButton: false,
                    })
                  }
                />
              </div>
            )}
            {activeTab === "promotions" && (
              <div className="mt-4">
                <PromotionTable
                  promotion={promotions}
                  onEdit={handleEditPromotion}
                />
              </div>
            )}
            {activeTab === "users" && (
              <div className="mt-4">
                <UserTable users={users} onEdit={handleEditUser} />
              </div>
            )}
          </>
        )}
      </main>

      {/* Movie Modal */}
      <AddOrEditMovieModal
        movie={editingMovie}
        open={editOpen}
        onClose={() => {
          setEditOpen(false);
          setEditingMovie(null);
        }}
        onSave={handleSave}
      />
    </div>
  );
}
