"use client";
import React, { useMemo, useState, useEffect, useRef, use } from "react";
import Swal from "sweetalert2";
import styles from "./ShowtimesTable.module.scss"
import { PendingSlotUpdate } from "@/app/admin/AdminClient";
import { createShowtimeBulk } from "@/lib/axios/admin/showtimeAPI";
import { useSession } from "next-auth/react";
import PriceModalForm from "../PriceModalForm/PriceModalForm";
export type MovieScreenSlot = { movie_screen_id: number; start_time: string; end_time: string };
export type ShowtimeDay = {
  available_seats: number;
  total_seats: number;
  showtime_id: number;
  movie_id: number | null;
  room_id: number;
  date: string;
  movie_title?: string | null;
  room_name?: string | null;
  movie_screen_id: number | null;
  cinema_id?: number | null;
  cinema_name?: string | null;
  price_normal?: number;
  price_student?: number;
};

export type RoomEntry = { room_id: number; name?: string; cinema_id?: number | null; total_seats?: string | number };
export type CinemaEntry = { cinema_id: number; name?: string };
type ExternalMovie = { movie_id?: number; id?: number; movieId?: number; name?: string | null; title?: string | null };

type Props = {
  showtimes: ShowtimeDay[];
  movieScreenings: MovieScreenSlot[];
  roomsList?: RoomEntry[];
  cinemasMap?: Record<number, CinemaEntry>;
  initialDate?: string | null;
  onCommit?: (changes: PendingSlotUpdate[]) => Promise<any>;
  onSelect?: (s: ShowtimeDay) => void;
  externalMovies?: ExternalMovie[];
  movieScreeningsByCinema?: Record<number, MovieScreenSlot[]>;
  onLoadingChange?: (v: boolean) => void;
  onBulkApplied?: () => Promise<any> | void;
  onSuccess?: (msg?: string) => void;
};
//Hàm lấy date từ datetime
const toDateKey = (d: string) => d?.slice(0, 10);
//Hàm lấy ngày hiện tại
const todayVN = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Ho_Chi_Minh" });
//Tạo ngày phục vụ cho việc thêm hàng loạt
function addDaysISO(d: string, days: number) {
  const dt = new Date(d + "T00:00:00");
  dt.setDate(dt.getDate() + days);
  return dt.toISOString().slice(0, 10);
}

export default function ShowtimeTimetable({
  showtimes = [],
  movieScreenings,
  roomsList = [],
  cinemasMap,
  movieScreeningsByCinema,
  initialDate = null,
  onCommit,
  externalMovies = [],
  onBulkApplied,
  onLoadingChange,
  onSuccess,
}: Props) {
  //Lấy showtime từ parent
  const [state, setState] = useState<ShowtimeDay[]>(showtimes);
  //trang thái kéo thả suất chiếu
  const [pending, setPending] = useState<Record<number, PendingSlotUpdate>>({});
  //Ngày hiện tại để kéo suất chiếu vào
  const [activeDate, setActiveDate] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("active_date") || initialDate;
    }
    return initialDate
  }
  );
  const [openPriceModal, setOpenPriceModal] = useState<boolean>(false);
  const [IdEditPrice, setIdEditPrice] = useState<number | null>(null);
  const [priceNormal, setPriceNormal] = useState(0);
  const [priceStudent, setPriceStudent] = useState(0);
  //Trạng thái kiểm tra đã có suất chiếu từ parent chưa
  const originalRef = useRef<ShowtimeDay[] | null>(null);
  //Hoạt ảnh thùng rác
  const [trashHover, setTrashHover] = useState(false);
  //Rạp hiện tại để kéo suất chiếu vào
  const [activeCinema, setActiveCinema] = useState<number | "all">(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem("active_cinema");
      if (saved === "all") return "all";
      if (saved && !isNaN(Number(saved))) return Number(saved);
    }
    return "all";
  });
  const { data: session } = useSession();
  const userId = session?.user?.user_id as number;
  //Thêm hàng loạt
  const [bulkApply, setBulkApply] = useState<{
    from_date: string;
    showtime_ids: number[];
  } | null>(null);
  const [bulkContexts, setBulkContexts] = useState<Array<{
    movie_id: number;
    room_id: number;
    movie_screen_id: number;
  }>>([]);


  // Hoạt ảnh
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [hoverSlot, setHoverSlot] = useState<string | null>(null);
  const [justInserted, setJustInserted] = useState<string | null>(null);

  // Biến dữ liệu khi kéo
  const dragData = useRef<{ type: "existing"; id: number; total_seats: number } | { type: "external"; movie_id: number; movie_name?: string } | null>(null);

  //Lấy showtime từ parent
  useEffect(() => {
    setState(showtimes);
    if (originalRef.current === null) originalRef.current = showtimes;
  }, [showtimes]);
  //Hàm khởi tạo lại dữ liệu kéo thả
  const clearDragState = () => {
    setHoverSlot(null);
    setDraggingId(null);
    dragData.current = null;
  };
  //Khỏi tạo lại dữ liệu kéo thả khi danh sách phim đang chiếu làm mới
  useEffect(() => {
    // setDraggingId(null);
    // setHoverSlot(null);
    // dragData.current = null;
    clearDragState();
  }, [externalMovies]);

  //Khởi tạo số ngày hiển thị
  const WINDOW_DAYS = 15;
  //Lấy ngày hiện tại làm ngày hiên thị
  const startDate = initialDate ?? todayVN();
  //Sinh ra một mảng các ngày liên tiếp bắt đầu từ startDate để phục vụ cho tính năng thêm hàng loạt
  const dateKeys = useMemo(() => {
    const out: string[] = [];
    for (let i = 0; i < WINDOW_DAYS; i++) out.push(addDaysISO(startDate, i));
    return out;
  }, [startDate]);
  //Gom suất chiếu theo phòng, theo khung giờ
  const grouped = useMemo(() => {
    const m: Record<string, Record<string, Record<number, ShowtimeDay | null>>> = {};
    for (const s of state) {
      const dk = toDateKey(s.date);
      if (!dk) continue;
      m[dk] ??= {};
      m[dk][String(s.room_id)] ??= {};
      m[dk][String(s.room_id)][s.movie_screen_id ?? -1] = s;
    }
    return m;
  }, [state]);

  //Kiểm tra nếu chưa có ngày hiển thị hiện tại thì sẽ hiển thị startDate
  useEffect(() => {
    if (!activeDate) {
      setActiveDate(startDate);
      if (typeof window !== "undefined") {
        sessionStorage.setItem("active_date", startDate);
      }
    }
  }, [startDate, activeDate]);


  useEffect(() => {
    const onDragEndGlobal = () => {
      clearDragState();
    };
    window.addEventListener("dragend", onDragEndGlobal);
    // also listen to pointerup to cover mobile/edge cases
    window.addEventListener("pointerup", onDragEndGlobal);
    return () => {
      window.removeEventListener("dragend", onDragEndGlobal);
      window.removeEventListener("pointerup", onDragEndGlobal);
    };
  }, []);

  const roomsByCinema = useMemo(() => {
    const out: Record<string, RoomEntry[]> = {};
    for (const r of roomsList) {
      const key = r.cinema_id == null ? "no-cinema" : String(r.cinema_id);
      (out[key] ??= []).push(r);
    }
    Object.values(out).forEach(arr => arr.sort((a, b) => a.room_id - b.room_id));
    return out;
  }, [roomsList]);
  const filteredRoomsByCinema = useMemo(() => {
    if (activeCinema === "all") return roomsByCinema;

    return {
      [activeCinema]: roomsByCinema[activeCinema] ?? []
    };
  }, [roomsByCinema, activeCinema]);
  const handleSelectDate = (date: string) => {
    if (date === activeDate) return;
    setActiveDate(date);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("active_date", date);
    }
  };

  function readDragPayload(e?: React.DragEvent<HTMLDivElement>) {
    try {
      if (e) {
        const txt = e.dataTransfer.getData("application/json");
        if (txt) return JSON.parse(txt);
      }
    } catch (err) {
      // ignore
    }
    // fallback to shared ref (if your code uses dragData.current)
    // @ts-ignore
    return (dragData && (dragData.current ?? null)) || null;
  }

  function handleDragOverTrash(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setTrashHover(true);
  }
  function handleDragLeaveTrash(_e: React.DragEvent<HTMLDivElement>) {
    setTrashHover(false);
  }

  async function handleDropToTrash(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setTrashHover(false);

    const payload = readDragPayload(e);
    if (!payload) return;

    // ✅ Parse showtimeId NGAY LẬP TỨC
    const showtimeId = Number(
      payload.showtime_id ??
      payload.id ??
      NaN
    );

    if (!Number.isFinite(showtimeId)) return;

    const isTemp = showtimeId < 0;

    // ✅ XÓA TEMP SHOWTIME
    if (isTemp) {
      setState(prev => prev.filter(s => s.showtime_id !== showtimeId));

      setPending(prev => {
        const out = { ...prev };
        delete out[showtimeId];
        return out;
      });

      setBulkApply(prev => {
        if (!prev) return null;
        const ids = prev.showtime_ids.filter(id => id !== showtimeId);
        return ids.length ? { ...prev, showtime_ids: ids } : null;
      });

      setBulkContexts(prev =>
        prev.filter(ctx =>
          !(
            ctx.movie_id === payload.movie_id &&
            ctx.room_id === payload.room_id &&
            ctx.movie_screen_id === payload.movie_screen_id
          )
        )
      );

      return;
    }

    // ✅ EXISTING SHOWTIME → soft delete
    setState(prev => prev.filter(s => s.showtime_id !== showtimeId));

    setPending(prev => ({
      ...prev,
      [showtimeId]: {
        showtime_id: showtimeId,
        from_slot: payload.movie_screen_id ?? null,
        to_slot: null,
        updated: { ...payload, status: 0 },
      }
    }));
  }


  const handleDragStart = (e: React.DragEvent, st: ShowtimeDay, total_seats: number) => {
    setDraggingId(st.showtime_id);
    e.dataTransfer.effectAllowed = "move";
    dragData.current = { type: "existing", id: st.showtime_id, total_seats };

    // Ẩn ghost image mặc định
    const img = new Image();
    img.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1' height='1'%3E%3C/svg%3E";
    e.dataTransfer.setDragImage(img, 0, 0);
  };
  const handleDragEndLocal = () => {
    // called from onDragEnd on elements and global dragend
    clearDragState();
  };
  // external drag start: normalize fields and setData
  const handleDragStartExternal = (e: React.DragEvent, mv: ExternalMovie) => {
    e.dataTransfer.effectAllowed = "copy";
    const movie_id_raw = mv?.movie_id ?? mv?.id ?? mv?.movieId;
    const movie_id = Number(movie_id_raw);
    const movie_name = mv?.name ?? mv?.title ?? undefined;

    try {
      // provide both types for cross-browser compatibility
      e.dataTransfer.setData("application/json", JSON.stringify({ movie_id: Number.isFinite(movie_id) ? movie_id : null, movie_name }));
      e.dataTransfer.setData("text/plain", String(Number.isFinite(movie_id) ? movie_id : ""));
    } catch (_) { }

    if (!Number.isFinite(movie_id)) {
      dragData.current = { type: "external", movie_id: undefined as any, movie_name };
    } else {
      dragData.current = { type: "external", movie_id, movie_name };
    }
    const img = new Image();
    img.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1' height='1'%3E%3C/svg%3E";
    e.dataTransfer.setDragImage(img, 0, 0);
  };

  //khởi tạo id tạm để hiển thị các suất chiếu trước khi lưu vào db
  const genTempId = () => -(Math.floor(Math.random() * 1_000_000) + 1);

  const handleDropSlot = async (roomId: number, total_seats: number, slotId: number, e: React.DragEvent) => {
    e.preventDefault();
    const d = dragData.current;
    if (!d) return;
    if (d.type === "existing") {
      const requireSeats = d.total_seats ?? 0;
      const roomTotalSeats = total_seats ?? 0;
      if (requireSeats > roomTotalSeats) {
        Swal.fire({
          icon: "warning",
          title: "Không đủ điều kiện đổi phòng",
          text: `Phòng này chỉ có ${roomTotalSeats} ghế, không đáp ứng suất chiếu cần ${requireSeats} ghế.`,
          confirmButtonText: "Đã hiểu",
        });
        dragData.current = null;
        return;
      }
    }
    const roomShow = grouped[activeDate ?? ""]?.[String(roomId)] ?? {};
    const currentOccupant = roomShow[slotId] || null;
    //Nếu thả movie vào slot hiện tại có movie đó
    if (currentOccupant && d.type === "existing" && currentOccupant.showtime_id === d.id) {
      // Thả vào chính slot hiện tại — không làm gì
      dragData.current = null;
      return;
    }

    //trường hợp movie đã có showtime
    if (d.type === "existing") {
      //Trường hợp thả movie đã có showtime vào một slot trống
      if (!currentOccupant) {
        const idx = state.findIndex(s => s.showtime_id === d.id);
        if (idx === -1) { dragData.current = null; return; }
        const old = state[idx];
        const updated = { ...old, movie_screen_id: slotId, room_id: roomId };
        setState(prev => { const copy = [...prev]; copy[idx] = updated; return copy; });
        setPending(prev => ({ ...prev, [d.id]: { showtime_id: d.id, from_slot: old.movie_screen_id, to_slot: slotId, updated } }));
      }//Trường hợp thả movie đã có showtime vào slot đã có movie khác
      else {
        const occupantId = Number(currentOccupant?.showtime_id ?? NaN);
        const srcId = Number(d.id);

        // defensive checks
        if (!Number.isFinite(occupantId) || !Number.isFinite(srcId) || occupantId === srcId) {
          dragData.current = null;
          return;
        }

        const srcIdx = state.findIndex(s => Number((s as any).showtime_id ?? (s as any).id) === srcId);
        const occIdx = state.findIndex(s => Number((s as any).showtime_id ?? (s as any).id) === occupantId);

        if (srcIdx === -1 || occIdx === -1) {
          // something's off (missing entries) — bail out gracefully
          dragData.current = null;
          return;
        }

        const src = state[srcIdx];
        const occ = state[occIdx];

        // compute swapped values:
        // src (the dragged show) moves to destination slot (slotId, roomId)
        const updatedSrc = {
          ...src,
          movie_screen_id: slotId,
          room_id: roomId,
        };
        // occ (current occupant) moves into src's old slot (src.movie_screen_id, src.room_id)
        const updatedOcc = {
          ...occ,
          movie_screen_id: src.movie_screen_id,
          room_id: src.room_id,
        };

        // apply to UI state
        setState(prev => {
          const copy = [...prev];
          copy[srcIdx] = updatedSrc;
          copy[occIdx] = updatedOcc;
          return copy;
        });

        // update pending for both items (record from -> to)
        setPending(prev => {
          const out = { ...prev };

          // dragged item pending
          out[srcId] = {
            showtime_id: srcId,
            from_slot: src.movie_screen_id ?? null,
            to_slot: slotId,
            updated: updatedSrc,
          };

          // occupant pending (moves to source slot)
          out[occupantId] = {
            showtime_id: occupantId,
            from_slot: occ.movie_screen_id ?? null,
            to_slot: src.movie_screen_id ?? null,
            updated: updatedOcc,
          };
          return out;
        });
        // dragData.current = null;
      }

    }//Trường hợp movie chưa có showtime 
    else {
      //Trường hợp kéo movie chưa có showtime vào slot trống
      if (!currentOccupant) {
        if (!activeDate) { dragData.current = null; return; }
        const tempId = genTempId();
        // newShow: temporary optimistic record
        const newShow: ShowtimeDay = {
          showtime_id: tempId,
          movie_id: d.movie_id ?? null,
          room_id: roomId,
          date: activeDate,
          movie_title: d.movie_name ?? null,
          room_name: undefined,
          movie_screen_id: slotId,
        };
        setBulkApply(prev => {
          const from = activeDate!;
          if (!prev || prev.from_date !== from) {
            return {
              from_date: from,
              showtime_ids: [tempId],
            };
          }
          return {
            ...prev,
            showtime_ids: [...prev.showtime_ids, tempId],
          };
        });
        setBulkContexts(prev => [
          ...prev,
          {
            movie_id: d.movie_id!,
            room_id: roomId,
            movie_screen_id: slotId,
          }
        ]);
        // optimistic insert (same as before)
        setState(prev => {
          const copy = [...prev, newShow].sort((a, b) => {
            if (a.date < b.date) return -1;
            if (a.date > b.date) return 1;
            if (a.room_id < b.room_id) return -1;
            if (a.room_id > b.room_id) return 1;
            return (a.movie_screen_id ?? -1) - (b.movie_screen_id ?? -1);
          });
          return copy;
        });

        setPending(prev => ({
          ...prev,
          [tempId]: { showtime_id: tempId, from_slot: null, to_slot: slotId, updated: newShow }
        }));
      } else {
        // Case: dragging a movie without a showtime INTO an occupied slot.
        // Behaviour: overwrite the occupant's show with the dragged movie (no new showtime created).
        if (!activeDate) { dragData.current = null; return; }

        const occ = currentOccupant as ShowtimeDay;
        const occId = Number((occ as any).showtime_id ?? (occ as any).id ?? NaN);
        if (!Number.isFinite(occId)) {
          // occupant has no server id (weird) — fallback to create a temp and replace as above
          dragData.current = null;
          return;
        }

        // Keep original slot (slotId, roomId) — we are replacing the movie occupying it.
        // Build updated occupant row (overwrite movie-related fields)
        const updatedOcc: ShowtimeDay = {
          ...occ,
          // assign movie data from dragged item 'd'
          movie_id: d.movie_id ?? null,
          movie_title: d.movie_name ?? occ.movie_title ?? null,
          // ensure it's on this slot/room/date
          movie_screen_id: slotId,
          room_id: roomId,
          // ensure date: if dragged movie provides an activeDate, keep it; else preserve existing
          date: activeDate ?? occ.date,
        };

        // Update UI state: replace occupant in state array
        setState(prev => {
          const copy = [...prev];
          const idx = copy.findIndex(s => Number((s as any).showtime_id ?? (s as any).id ?? NaN) === occId);
          if (idx !== -1) copy[idx] = updatedOcc;
          return copy;
        });

        // Add pending update for the occupant (so commit will update existing showtime)
        setPending(prev => {
          const out = { ...prev };
          out[occId] = {
            showtime_id: occId,
            from_slot: occ.movie_screen_id ?? null,
            to_slot: slotId,
            updated: updatedOcc,
          };
          return out;
        });
      }


    }
    dragData.current = null;
  };

  const handleOpenCustomPriceModal = (id, normal, student) => {
    setIdEditPrice(id);
    setPriceNormal(normal);
    setPriceStudent(student);
    console.log("id:", id);
    setOpenPriceModal(true);
  }
  const handleClosePriceModal = () => {
    setIdEditPrice(null);
    setPriceNormal(0);
    setPriceStudent(0);
    setOpenPriceModal(false);
  }
  const commit = async () => {
    const changes = Object.values(pending);
    if (!changes.length) return;
    if (onCommit) await onCommit(changes);
    originalRef.current = state;
    setPending({});
  };
  const handleSave = async () => {
    if (!Object.keys(pending).length) return;

    // 👉 Có bulk context
    if (bulkApply && bulkContexts.length > 0) {
      const result = await Swal.fire({
        title: "Áp dụng nhiều ngày?",
        text: `Bạn vừa thêm ${bulkApply.showtime_ids.length} suất chiếu mới.`,
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Áp dụng nhiều ngày",
        cancelButtonText: "Chỉ ngày này",
      });

      // 🔴 User chọn "Áp dụng nhiều ngày"
      if (result.isConfirmed) {
        const resDate = await Swal.fire({
          title: "Chọn ngày kết thúc",
          input: "date",
          inputAttributes: {
            min: bulkApply.from_date,
          },
          showCancelButton: true,
          confirmButtonText: "Áp dụng",
          cancelButtonText: "Hủy",
        });

        // ❌ User CANCEL chọn ngày → KHÔNG LÀM GÌ
        if (!resDate.isConfirmed || !resDate.value) {
          return;
        }

        // ✅ User chọn ngày hợp lệ → BULK
        try {
          onLoadingChange?.(true);

          const res = await createShowtimeBulk({
            from_date: bulkApply.from_date,
            to_date: resDate.value,
            items: bulkContexts,
            user_id: userId,
          });

          setBulkApply(null);
          setBulkContexts([]);
          setPending({});

          if (onBulkApplied) await onBulkApplied();
          onSuccess?.("Áp dụng suất chiếu thành công");
        } catch (err: any) {
          const msg =
            err?.response?.data?.message ||
            err?.message ||
            "Không thể áp dụng suất chiếu";

          await Swal.fire({
            icon: "error",
            title: "Tạo suất chiếu thất bại",
            text: msg,
          });
        }
        finally {
          onLoadingChange?.(false);
        }

        return; // 🔥 cực kỳ quan trọng
      }

      // 🟡 User chọn "Chỉ ngày này" → COMMIT
      await commit();
      setBulkApply(null);
      setBulkContexts([]);
      return;
    }

    // 👉 Không có bulk → commit bình thường
    await commit();
  };

  async function handleSavePrice() {
    if (onBulkApplied) await onBulkApplied();
    handleClosePriceModal();
  }


  const discard = () => {
    if (originalRef.current) setState(originalRef.current);
    setPending({});
    setBulkApply(null);
    setBulkContexts([]);

  };

  if (!activeDate) return <div>Không có suất.</div>;

  return (
    <div className="p-4 bg-white rounded shadow">
      <div className="flex items-start gap-4 mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-4 mb-4">
            <label>Ngày:</label>
            <select value={activeDate ?? ""} onChange={(e) => void handleSelectDate(e.target.value)} className="border px-2 py-1 rounded cursor-pointer">
              {dateKeys.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <label>Rạp:</label>
            <select
              value={activeCinema}
              onChange={(e) => {
                const value =
                  e.target.value === "all" ? "all" : Number(e.target.value);

                setActiveCinema(value);

                if (typeof window !== "undefined") {
                  sessionStorage.setItem("active_cinema", String(value));
                }
              }}
              className="border px-2 py-1 rounded cursor-pointer"
            >
              <option value="all">Tất cả rạp</option>
              {Object.values(cinemasMap).map(c => (
                <option key={c.cinema_id} value={c.cinema_id}>
                  {c.name}
                </option>
              ))}
            </select>

            {Object.keys(pending).length > 0 && (
              <>
                <span className="text-amber-600">{Object.keys(pending).length} thay đổi</span>
                <button onClick={handleSave} className="bg-blue-600 text-white px-3 py-1 rounded cursor-pointer">Lưu</button>
                <button onClick={discard} className="border px-3 py-1 rounded cursor-pointer">Hủy</button>
              </>
            )}

          </div>

          <div className="space-y-6">
            {Object.entries(filteredRoomsByCinema).map(([cinemaKey, rooms]) => {
              console.log("roomsmap:", rooms);
              const cinemaId = cinemaKey === "no-cinema" ? null : Number(cinemaKey);
              const cinemaName = (cinemaId && cinemasMap?.[cinemaId]?.name) || `Rạp ${cinemaId ?? ""}`;
              const cinemaSlots =
                cinemaId && movieScreeningsByCinema[cinemaId]
                  ? movieScreeningsByCinema[cinemaId]
                  : [];
              return (
                <div key={cinemaKey} className="border rounded p-3">
                  <div className="font-medium mb-3">{cinemaName}</div>

                  {rooms.length === 0 ? (
                    <div className="col-span-full text-sm text-gray-500 italic text-center py-6">
                      Không có phòng
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-2 gap-4">
                      {rooms.map(room => {
                        const roomShow = grouped[activeDate]?.[room.room_id] || {};
                        console.log("room:", room);
                        return (
                          <div key={room.room_id} className="border p-3 rounded">
                            <div className="flex justify-between">
                              <div className="font-medium mb-2">{room.name}</div>
                              <div className="text-slate-600 mb-2">{room.total_seats} ghế</div>
                            </div>

                            <div className="space-y-2">
                              {cinemaSlots.map(slot => {
                                const existing = roomShow[slot.movie_screen_id] || null;
                                return (

                                  <div
                                    key={slot.movie_screen_id}
                                    className={`border rounded p-2 bg-gray-50 transition-all
    ${hoverSlot === `${room.room_id}-${slot.movie_screen_id}` ? styles.slotHover : ""}
    ${justInserted === `${room.room_id}-${slot.movie_screen_id}` ? styles.insertFlash : ""}
  `}
                                    onDragOver={(e) => {
                                      e.preventDefault();
                                      setHoverSlot(`${room.room_id}-${slot.movie_screen_id}`);
                                    }}
                                    onDragLeave={() => setHoverSlot(null)}
                                    onDrop={(e) => {
                                      setHoverSlot(null);
                                      setJustInserted(`${room.room_id}-${slot.movie_screen_id}`);
                                      setTimeout(() => setJustInserted(null), 400);
                                      void handleDropSlot(room.room_id, room.total_seats, slot.movie_screen_id, e);
                                    }}
                                  >
                                    <div className="text-xs text-gray-600 mb-1">{slot.start_time} – {slot.end_time}</div>

                                    {existing ? (

                                      <div
                                        className={`p-2 bg-white border rounded cursor-move ${styles.dragItem}
    ${draggingId === existing.showtime_id ? styles.dragging : ""}
    ${justInserted === `${room.room_id}-${slot.movie_screen_id}` ? styles.fadeIn : ""}
  `}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, existing, Number(room.total_seats))}
                                        onDragEnd={handleDragEndLocal}
                                        onClick={() => { handleOpenCustomPriceModal(existing.showtime_id, existing.price_normal, existing.price_student) }}
                                      >
                                        <div className="float-right w-20">
                                          <div className="text-[10px] text-gray-500 text-right mb-0.5">
                                            {existing.available_seats}/{existing.total_seats}
                                          </div>
                                          <div className="h-1 bg-gray-200 rounded">
                                            <div
                                              className="h-1 bg-green-500 rounded"
                                              style={{
                                                width: `${(existing.available_seats / existing.total_seats) * 100}%`
                                              }}
                                            />
                                          </div>
                                        </div>


                                        <div className="font-medium">{existing.movie_title}</div>
                                      </div>
                                    ) : (
                                      <div className="text-xs text-gray-400 italic">(Trống)</div>
                                    )}
                                  </div>

                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {openPriceModal && (
            <div>
              <PriceModalForm isOpen={openPriceModal} onClose={handleClosePriceModal} currentPriceNormal={priceNormal} currentPriceStudent={priceStudent} onSave={handleSavePrice} currentId={IdEditPrice} />
            </div>
          )}
        </div>

        <div className="w-72 border-l pl-4 sticky top-0 self-start">
          <div className="font-medium mb-2 ">Danh sách phim đang chiếu</div>
          <div className="space-y-2 max-h-[70vh] overflow-auto pr-2 ">
            {externalMovies.length === 0 && <div className="text-sm text-gray-500 italic">Không có phim.</div>}
            {externalMovies.map(mv => {
              // normalize display name & id for robustness
              const displayId = mv?.movie_id ?? mv?.id ?? mv?.movieId;
              const displayName = mv?.name ?? mv?.title ?? "";
              return (
                <div
                  className={`p-2 border rounded bg-white cursor-grab ${styles.dragItem}
    ${draggingId === displayId ? styles.dragging : ""}`}
                  draggable
                  onDragStart={(e) => handleDragStartExternal(e, mv)}
                  onDragEnd={handleDragEndLocal}
                >
                  <div className="font-medium text-sm">Phim {displayName}</div>
                  <div className="text-xs text-gray-500">ID: {displayId}</div>
                </div>
              );
            })}
          </div>
          {/* Trash can area */}
          <div
            className={`mt-3 rounded border-dashed border-2 p-3 flex items-center justify-center cursor-copy 
    ${styles.trashGlow} 
    ${trashHover ? styles.trashActive : ""}`}
            onDragOver={handleDragOverTrash}
            onDragEnter={handleDragOverTrash}
            onDragLeave={handleDragLeaveTrash}
            onDrop={handleDropToTrash}
          >
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M10 3h4l1 4H9l1-4z" />
              </svg>
              <div className="text-sm text-red-700 font-medium">{trashHover ? "Thả để xóa" : "Thùng rác"}</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}