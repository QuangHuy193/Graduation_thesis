"use client";
import React, { useMemo, useState, useEffect, useRef } from "react";

export type MovieScreenSlot = { movie_screen_id: number; start_time: string; end_time: string };
export type ShowtimeDay = {
  id: number;
  showtime_id: number;
  movie_id: number | null;
  room_id: number;
  show_date: string;
  movie_title?: string | null;
  room_name?: string | null;
  movie_screen_id: number | null;
  screening_start?: string | null;
  screening_end?: string | null;
  cinema_id?: number | null;
  cinema_name?: string | null;
};
type PendingSlotUpdate = { showtime_day_id: number; from_slot: number | null; to_slot: number; updated: ShowtimeDay };
export type RoomEntry = { room_id: number; name?: string; cinema_id?: number | null };
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
  onAdd?: (payload: { movie_id: number; room_id: number; movie_screen_id: number; show_date: string; _temp_client_id?: number }) => Promise<ShowtimeDay>;
};

const toDateKey = (d: string) => d?.slice(0, 10);
const todayVN = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Ho_Chi_Minh" });

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
  initialDate = null,
  onCommit,
  onSelect,
  externalMovies = [],
  onAdd,
}: Props) {
  const [state, setState] = useState<ShowtimeDay[]>(showtimes);
  const [pending, setPending] = useState<Record<number, PendingSlotUpdate>>({});
  const [activeDate, setActiveDate] = useState<string | null>(initialDate);
  const originalRef = useRef<ShowtimeDay[] | null>(null);
  // dragData supports existing or external normalized
  const dragData = useRef<{ type: "existing"; id: number } | { type: "external"; movie_id: number; movie_name?: string } | null>(null);

  useEffect(() => {
    setState(showtimes);
    if (originalRef.current === null) originalRef.current = showtimes;
  }, [showtimes]);

  const WINDOW_DAYS = 15;
  const startDate = initialDate ?? todayVN();

  const dateKeys = useMemo(() => {
    const out: string[] = [];
    for (let i = 0; i < WINDOW_DAYS; i++) out.push(addDaysISO(startDate, i));
    return out;
  }, [startDate]);

  const grouped = useMemo(() => {
    const m: Record<string, Record<string, Record<number, ShowtimeDay | null>>> = {};
    for (const s of state) {
      const dk = toDateKey(s.show_date);
      if (!dk) continue;
      m[dk] ??= {};
      m[dk][String(s.room_id)] ??= {};
      m[dk][String(s.room_id)][s.movie_screen_id ?? -1] = s;
    }
    return m;
  }, [state]);

  useEffect(() => {
    if (!activeDate) {
      setActiveDate(startDate);
    }
  }, [startDate, activeDate]);

  const roomsByCinema = useMemo(() => {
    const out: Record<string, RoomEntry[]> = {};
    for (const r of roomsList) {
      const key = r.cinema_id == null ? "no-cinema" : String(r.cinema_id);
      (out[key] ??= []).push(r);
    }
    Object.values(out).forEach(arr => arr.sort((a, b) => a.room_id - b.room_id));
    return out;
  }, [roomsList]);

  const handleSelectDate = (date: string) => { if (date === activeDate) return; setActiveDate(date); };

  // existing drag start: also setData for browser compatibility
  const handleDragStart = (e: React.DragEvent, st: ShowtimeDay) => {
    e.dataTransfer.effectAllowed = "move";
    try { e.dataTransfer.setData("text/plain", String(st.id)); } catch (_) { }
    dragData.current = { type: "existing", id: st.id };
    // debug
    console.log("dragstart existing", st.id);
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
      console.warn("external movie missing numeric id", mv);
      dragData.current = { type: "external", movie_id: undefined as any, movie_name };
    } else {
      dragData.current = { type: "external", movie_id, movie_name };
    }
    console.log("dragstart external", dragData.current);
  };


  const genTempId = () => -(Math.floor(Math.random() * 1_000_000) + 1);

  // mark: THIS FUNCTION IS ASYNC because we await onAdd
  const handleDropSlot = async (roomId: number, slotId: number, e: React.DragEvent) => {
    e.preventDefault();
    const d = dragData.current;
    console.log("drop attempt", { roomId, slotId, activeDate, dragData: d });
    if (!d) return;

    if (d.type === "existing") {
      const idx = state.findIndex(s => s.id === d.id);
      if (idx === -1) { dragData.current = null; return; }
      const old = state[idx];
      const updated = { ...old, movie_screen_id: slotId, room_id: roomId };
      setState(prev => { const copy = [...prev]; copy[idx] = updated; return copy; });
      setPending(prev => ({ ...prev, [d.id]: { showtime_day_id: d.id, from_slot: old.movie_screen_id, to_slot: slotId, updated } }));
    } else {
      if (!activeDate) return;
      const tempId = genTempId();
      // newShow: temporary optimistic record
      const newShow: ShowtimeDay = {
        id: tempId,
        showtime_id: 0, // placeholder; server will return real showtime_id
        movie_id: d.movie_id || null,
        room_id: roomId,
        show_date: activeDate,
        movie_title: d.movie_name ?? null,
        room_name: undefined,
        movie_screen_id: slotId,
      };

      // optimistic insert
      setState(prev => {
        const copy = [...prev, newShow].sort((a, b) => {
          if (a.show_date < b.show_date) return -1;
          if (a.show_date > b.show_date) return 1;
          if (a.room_id < b.room_id) return -1;
          if (a.room_id > b.room_id) return 1;
          return (a.movie_screen_id ?? -1) - (b.movie_screen_id ?? -1);
        });
        return copy;
      });
      setPending(prev => ({ ...prev, [tempId]: { showtime_day_id: tempId, from_slot: null, to_slot: slotId, updated: newShow } }));

      if (onAdd) {
        try {
          const serverObj = await onAdd({
            movie_id: d.movie_id,
            room_id: roomId,
            movie_screen_id: slotId,
            show_date: activeDate,
            _temp_client_id: tempId,
          });

          // ensure serverObj exists and has id
          if (!serverObj || typeof (serverObj as any).id !== "number") {
            // revert optimistic
            setState(prev => prev.filter(p => p.id !== tempId));
            setPending(prev => { const cp = { ...prev }; delete cp[tempId]; return cp; });
            throw new Error("Invalid server response from onAdd");
          }

          // replace temp with server row
          setState(prev => prev.map(p => (p.id === tempId ? serverObj : p)));

          setPending(prev => {
            const copy = { ...prev };
            const item = copy[tempId];
            if (!item) return copy;
            delete copy[tempId];
            copy[serverObj.id] = {
              showtime_day_id: serverObj.id,
              from_slot: null,
              to_slot: slotId,
              updated: serverObj,
            };
            return copy;
          });
        } catch (err) {
          console.error("onAdd failed:", err);
          // revert optimistic
          setState(prev => prev.filter(p => p.id !== tempId));
          setPending(prev => { const cp = { ...prev }; delete cp[tempId]; return cp; });
          // optionally rethrow so caller (parent) can show toast
          throw err;
        }
      }
    }

    dragData.current = null;
  };

  const commit = async () => {
    const changes = Object.values(pending);
    if (!changes.length) return;
    if (onCommit) await onCommit(changes);
    originalRef.current = state;
    setPending({});
  };

  const discard = () => { if (originalRef.current) setState(originalRef.current); setPending({}); };

  if (!activeDate) return <div>Không có suất.</div>;

  return (
    <div className="p-4 bg-white rounded shadow">
      <div className="flex items-start gap-4 mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-4 mb-4">
            <label>Ngày:</label>
            <select value={activeDate ?? ""} onChange={(e) => void handleSelectDate(e.target.value)} className="border px-2 py-1 rounded">
              {dateKeys.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            {Object.keys(pending).length > 0 && (
              <>
                <span className="text-amber-600">{Object.keys(pending).length} thay đổi</span>
                <button onClick={commit} className="bg-blue-600 text-white px-3 py-1 rounded">Lưu</button>
                <button onClick={discard} className="border px-3 py-1 rounded">Hủy</button>
              </>
            )}
          </div>

          <div className="space-y-6">
            {Object.entries(roomsByCinema).map(([cinemaKey, rooms]) => {
              const cinemaId = cinemaKey === "no-cinema" ? null : Number(cinemaKey);
              const cinemaName = (cinemaId && cinemasMap?.[cinemaId]?.name) || `Rạp ${cinemaId ?? ""}`;
              return (
                <div key={cinemaKey} className="border rounded p-3">
                  <div className="font-medium mb-3">{cinemaName}</div>
                  <div className="grid md:grid-cols-2 gap-4">
                    {rooms.map(room => {
                      const roomShow = grouped[activeDate]?.[room.room_id] || {};
                      return (
                        <div key={room.room_id} className="border p-3 rounded">
                          <div className="font-medium mb-2">{room.name}</div>
                          <div className="space-y-2">
                            {movieScreenings.map(slot => {
                              const existing = roomShow[slot.movie_screen_id] || null;
                              return (
                                <div key={slot.movie_screen_id} className="border rounded p-2 bg-gray-50" onDragOver={(e) => e.preventDefault()} onDrop={(e) => void handleDropSlot(room.room_id, slot.movie_screen_id, e)}>
                                  <div className="text-xs text-gray-600 mb-1">{slot.start_time} – {slot.end_time}</div>
                                  {existing ? (
                                    <div className="p-2 bg-white border rounded cursor-move" draggable onDragStart={(e) => handleDragStart(e, existing)} onClick={() => onSelect?.(existing)}>
                                      <div className="font-medium">{existing.movie_title ?? `Phim #${existing.movie_id}`}</div>
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
                </div>
              );
            })}
          </div>
        </div>

        <div className="w-72 border-l pl-4">
          <div className="font-medium mb-2">Danh sách phim</div>
          <div className="space-y-2 max-h-[60vh] overflow-auto pr-2">
            {externalMovies.length === 0 && <div className="text-sm text-gray-500 italic">Không có phim.</div>}
            {externalMovies.map(mv => {
              // normalize display name & id for robustness
              const displayId = mv?.movie_id ?? mv?.id ?? mv?.movieId;
              const displayName = mv?.name ?? mv?.title ?? "";
              return (
                <div key={String(displayId ?? Math.random())} className="p-2 border rounded bg-white cursor-grab" draggable onDragStart={(e) => handleDragStartExternal(e, mv)} title="Kéo phim vào slot">
                  <div className="font-medium text-sm">Phim {displayName}</div>
                  <div className="text-xs text-gray-500">ID: {displayId}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
