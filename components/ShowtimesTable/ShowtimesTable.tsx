// components/ShowtimeTimetable/ShowtimeTimetable.tsx
"use client";

import React, { useMemo, useState, useEffect } from "react";

export type ShowtimeRaw = {
  showtime_id: number;
  start_date: string; // datetime ISO or DB string
  end_date: string;
  status?: number | null;
  movie_id?: number | null;
  room_id?: number | null;
  // optional joined objects
  movie_title?: string | null;
  room_name?: string | null;

  screening_start?: string | null;
  screening_end?: string | null;

  // optional cinema name (from your SQL)
  cinema_name?: string | null;
  // optional movie_screen_id etc are okay but not required here
};
type PendingMove = {
  showtime_id: number;
  from_room: number | null;
  to_room: number | null;
  // optional: snapshot of updated showtime for UI
  updated?: ShowtimeRaw;
};

type MovieLite = { movie_id: number; title?: string };
type RoomEntry = { room_id: number; name?: string; cinema_id?: number | null };
type CinemaEntry = { cinema_id: number; name?: string };

type Props = {
  showtimes?: ShowtimeRaw[];
  moviesMap?: Record<number, MovieLite>;
  roomsMap?: Record<number, { room_id: number; name?: string; cinema_id?: number | null }>;
  // a definitive list of rooms to always display (preferred). If not provided, we will infer from roomsMap or showtimes.
  roomsList?: RoomEntry[];
  // mapping of cinema_id -> CinemaEntry (optional). If not provided we'll infer from showtimes' cinema_name.
  cinemasMap?: Record<number, CinemaEntry>;
  onSelect?: (st: ShowtimeRaw) => void;
  // optional initial date to focus (ISO date string yyyy-mm-dd)
  initialDate?: string | null;

  /**
   * Called when a showtime is moved to another room.
   * signature: (showtime_id, new_room_id (number|null), updatedShowtime) => void
   */
  onMove?: (showtime_id: number, new_room_id: number | null, updated?: ShowtimeRaw) => void;
  onCommit?: (moves: PendingMove[]) => Promise<any>;
};

function toDateKey(dateStr: string) {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    return d.toISOString().slice(0, 10); // YYYY-MM-DD
  } catch {
    return null;
  }
}

function fmtDate(dateStr?: string | null) {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  } catch {
    return dateStr ?? "-";
  }
}

export default function Showtimestable({
  showtimes = [],
  onSelect,
  initialDate = null,
  onMove,
  onCommit,
}: Props) {
  // local copy so UI updates immediately on drag-drop
  const [showtimesState, setShowtimesState] = useState<ShowtimeRaw[]>(showtimes || []);
  // filter + active date
  const [filterMovie, setFilterMovie] = useState<string>(""); // movie_id as string
  const [activeDate, setActiveDate] = useState<string | null>(initialDate);
  const [pendingMap, setPendingMap] = useState<Record<number, PendingMove>>({});
  // drag state to highlight drop targets
  const [dragOverRoomId, setDragOverRoomId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // keep local state in sync if prop changes
  useEffect(() => {
    setShowtimesState(showtimes || []);
  }, [showtimes]);

  // build movie options from showtimes
  const movieOptions = useMemo(() => {
    const map = new Map<number, string>();
    (showtimesState || []).forEach((s) => {
      const mid = Number(s.movie_id ?? 0);
      if (!mid) return;
      const title = s.movie_title ?? `Phim #${mid}`;
      map.set(mid, title);
    });
    return Array.from(map.entries()).map(([id, title]) => ({ id, title }));
  }, [showtimesState]);

  // --------------------------
  // canonicalRooms: build ONCE from props (showtimes) so rooms won't disappear
  // --------------------------
  const initialRoomsRef = React.useRef<RoomEntry[] | null>(null);
  if (initialRoomsRef.current === null) {
    const byId = new Map<number, RoomEntry>();
    // derive rooms from the original showtimes prop (not showtimesState)
    for (const s of showtimes || []) {
      const rid = Number(s.room_id ?? NaN);
      if (!Number.isFinite(rid)) continue;
      if (!byId.has(rid)) {
        byId.set(rid, {
          room_id: rid,
          name: s.room_name ?? `Phòng ${rid}`,
          cinema_id: (s as any).cinema_id ?? null,
        });
      }
    }
    initialRoomsRef.current = Array.from(byId.values());
  }

  const canonicalRooms = useMemo(() => {
    return initialRoomsRef.current ?? [];
  }, []);
  // --------------------------

  // map rooms by cinema_id
  const roomsByCinema = useMemo(() => {
    const out: Record<string, RoomEntry[]> = {};
    for (const r of canonicalRooms) {
      const cid = (r.cinema_id ?? (r as any).cinema_id ?? "no-cinema");
      const key = cid === null || cid === undefined ? "no-cinema" : String(cid);
      if (!out[key]) out[key] = [];
      out[key].push(r);
    }
    // sort rooms by room_id
    for (const k of Object.keys(out)) {
      out[k].sort((a, b) => a.room_id - b.room_id);
    }
    return out;
  }, [canonicalRooms]);

  // group showtimes by date -> room
  const grouped = useMemo(() => {
    const g: Record<string, Record<string, ShowtimeRaw[]>> = {}; // date -> roomId -> list
    for (const s of showtimesState || []) {
      const dateKey = toDateKey(s.start_date) || "unknown";
      if (!g[dateKey]) g[dateKey] = {};
      const roomId = String(s.room_id ?? "no-room");
      if (!g[dateKey][roomId]) g[dateKey][roomId] = [];
      g[dateKey][roomId].push(s);
    }
    // sort each day's rooms and times
    for (const date of Object.keys(g)) {
      for (const room of Object.keys(g[date])) {
        g[date][room].sort((a, b) => {
          return new Date(a.start_date).getTime() - new Date(b.start_date).getTime();
        });
      }
    }
    return g;
  }, [showtimesState]);

  // sorted date keys (asc)
  const dateKeys = useMemo(() => {
    const keys = Object.keys(grouped).filter((k) => k !== "unknown");
    keys.sort((a, b) => (a > b ? 1 : -1));
    if (grouped["unknown"]) keys.push("unknown");
    return keys;
  }, [grouped]);

  // if activeDate not set, pick first
  useEffect(() => {
    if (!activeDate && dateKeys.length) setActiveDate(dateKeys[0]);
  }, [dateKeys, activeDate]);

  // For a given activeDate, produce mapping: cinema_id -> room_id -> showtime[]
  const cinemasForActive = useMemo(() => {
    if (!activeDate) return {};
    const out: Record<string, Record<string, ShowtimeRaw[]>> = {};
    // for every cinema in roomsByCinema, ensure rooms exist even without showtimes
    for (const cinemaKey of Object.keys(roomsByCinema)) {
      out[cinemaKey] = {};
      for (const r of roomsByCinema[cinemaKey]) {
        const rid = String(r.room_id);
        const items = (grouped[activeDate] && (grouped[activeDate][rid] || grouped[activeDate][String(r.room_id)])) || [];
        out[cinemaKey][rid] = items.slice(); // copy
      }
    }

    // Also include any rooms that appear in grouped but not in roomsByCinema (fallback)
    const byRoom = grouped[activeDate] || {};
    for (const r of Object.keys(byRoom)) {
      // skip if already included
      let included = false;
      for (const ck of Object.keys(out)) {
        if (out[ck][r]) {
          included = true;
          break;
        }
      }
      if (!included) {
        // put into "no-cinema"
        if (!out["no-cinema"]) out["no-cinema"] = {};
        out["no-cinema"][r] = byRoom[r].slice();
      }
    }

    // apply movie filter if set
    if (!filterMovie) return out;
    const mid = Number(filterMovie);
    const filteredOut: Record<string, Record<string, ShowtimeRaw[]>> = {};
    for (const ck of Object.keys(out)) {
      filteredOut[ck] = {};
      for (const rid of Object.keys(out[ck])) {
        const filtered = out[ck][rid].filter((s) => Number(s.movie_id ?? 0) === mid);
        filteredOut[ck][rid] = filtered;
      }
    }
    return filteredOut;
  }, [activeDate, grouped, roomsByCinema, filterMovie]);
  const originalSnapshotRef = React.useRef<ShowtimeRaw[] | null>(null);
  useEffect(() => {
    // capture first props snapshot (or update when showtimes prop changes if you prefer)
    if (originalSnapshotRef.current === null) originalSnapshotRef.current = showtimes || [];
  }, [showtimes]);
  // drag handlers
  const handleDragStart = (e: React.DragEvent, showtime: ShowtimeRaw) => {
    e.dataTransfer.setData("text/plain", String(showtime.showtime_id));
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOverRoom = (e: React.DragEvent, roomId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverRoomId !== roomId) setDragOverRoomId(roomId);
  };

  const handleDragLeaveRoom = (_e: React.DragEvent, roomId: string) => {
    if (dragOverRoomId === roomId) setDragOverRoomId(null);
  };

  const handleDropToRoom = (e: React.DragEvent, targetRoomId: string) => {
    e.preventDefault();
    setDragOverRoomId(null);
    const txt = e.dataTransfer.getData("text/plain");
    if (!txt) return;
    const sid = Number(txt);
    if (Number.isNaN(sid)) return;

    const idx = showtimesState.findIndex((s) => s.showtime_id === sid);
    if (idx === -1) return;

    const oldRoom = showtimesState[idx].room_id ?? null;
    const newRoomNum = targetRoomId === "no-room" ? null : Number(targetRoomId);
    // create updated showtime for UI
    const updated = { ...showtimesState[idx], room_id: newRoomNum };
    const roomDef = canonicalRooms.find((r) => String(r.room_id) === targetRoomId);
    if (roomDef) updated.room_name = roomDef.name ?? updated.room_name;

    // update UI immediately
    setShowtimesState(prev => {
      const copy = [...prev];
      copy[idx] = updated;
      return copy;
    });

    // add/replace pending move (deduplicate by showtime_id)
    setPendingMap(prev => {
      const copy = { ...prev };
      copy[sid] = {
        showtime_id: sid,
        from_room: oldRoom,
        to_room: newRoomNum,
        updated,
      };
      return copy;
    });

    // DO NOT call onMove here (we wait for Commit)
  };
  const handleCommit = async () => {
    const moves = Object.values(pendingMap);
    if (!moves.length) return;

    // snapshot must exist (you captured originalSnapshotRef earlier)
    setSaving(true);
    try {
      // If parent provided onCommit (preferred - batch)
      if (typeof onCommit === "function") {
        await onCommit(moves);
      } else if (typeof onMove === "function") {
        // fallback: call onMove for each move serially
        // consider doing them sequentially to preserve order and simplify rollback
        for (const m of moves) {
          await onMove(m.showtime_id, m.to_room, m.updated);
        }
      } else {
        // no parent handler — nothing to persist, just clear pending
        setPendingMap({});
        return;
      }

      // success -> clear pending
      setPendingMap({});
    } catch (err) {
      // rollback UI to original snapshot if available
      if (originalSnapshotRef.current) {
        setShowtimesState(originalSnapshotRef.current);
      }
      setPendingMap({});
      // bubble up or show error — you can customize notification here
      console.error("Commit failed:", err);
      // rethrow so parent can react if needed
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    // revert UI to original snapshot
    if (originalSnapshotRef.current) setShowtimesState(originalSnapshotRef.current);
    setPendingMap({});
  };

  const handleDragEnd = () => {
    setDragOverRoomId(null);
  };

  return (
    <div className="bg-white rounded shadow p-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <label className="text-sm">Ngày:</label>
          <select
            className="border rounded px-2 py-1 cursor-pointer"
            value={activeDate ?? ""}
            onChange={(e) => setActiveDate(e.target.value || null)}
          >
            {dateKeys.map((d) => (
              <option key={d} value={d}>
                {d === "unknown" ? "Không xác định" : d}
              </option>
            ))}
          </select>

          <label className="text-sm">Phim:</label>
          <select
            className="border rounded px-2 py-1 cursor-pointer"
            value={filterMovie}
            onChange={(e) => setFilterMovie(e.target.value)}
          >
            <option value="">Tất cả</option>
            {movieOptions.map((m) => (
              <option key={m.id} value={String(m.id)}>
                {m.title}
              </option>
            ))}
          </select>
          {/* Pending changes UI */}
          {Object.keys(pendingMap).length > 0 && (
            <div className="flex items-center gap-2">
              <div className="text-sm text-amber-600">Thay đổi: {Object.keys(pendingMap).length}</div>
              <button onClick={handleCommit} className="px-3 py-1 bg-blue-600 text-white rounded text-sm cursor-pointer">Xác nhận thay đổi</button>
              <button onClick={handleDiscard} className="px-3 py-1 border rounded text-sm cursor-pointer">Hủy</button>
            </div>
          )}

          <button
            onClick={() => {
              setFilterMovie("");
              setActiveDate(dateKeys[0] ?? null);
            }}
            className="px-2 py-1 border rounded text-sm cursor-pointer"
          >
            Reset
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-sm text-slate-600">Tổng suất: {showtimesState?.length ?? 0}</div>
        </div>
      </div>

      {!activeDate ? (
        <div className="p-6 text-center text-slate-500">Không có suất chiếu</div>
      ) : (
        <div>
          <h3 className="font-medium mb-2">Suất chiếu ngày {activeDate}</h3>

          {/* cinemas list */}
          <div className="space-y-6">
            {Object.keys(cinemasForActive).length === 0 ? (
              <div className="text-sm text-slate-500 p-4">Không có suất phù hợp</div>
            ) : (
              Object.entries(cinemasForActive).map(([cinemaKey, roomsObj]) => {
                const cinemaId = cinemaKey === "no-cinema" ? null : Number(cinemaKey);
                const cinemaName =
                  (cinemaId !== null) ||
                  // try to infer from one of the showtimes in this cinema
                  (Object.values(roomsObj).flat()[0]?.cinema_name ?? (cinemaId === null ? "Rạp (không xác định)" : `Rạp ${cinemaId}`));

                return (
                  <div key={cinemaKey} className="border rounded p-3">
                    <div className="flex items-center justify-between mb-3">
                      <div className="font-medium">{cinemaName}</div>
                      <div className="text-sm text-slate-500">
                        Phòng: {Object.keys(roomsObj).length}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ">
                      {Object.entries(roomsObj).map(([roomId, items]) => {
                        const roomDef = canonicalRooms.find((r) => String(r.room_id) === roomId);
                        const roomName =
                          roomDef?.name ??
                          items[0]?.room_name ??
                          (roomId === "no-room" ? "Phòng (không xác định)" : `Phòng ${roomId}`);

                        const isDragOver = dragOverRoomId === roomId;

                        return (
                          <div
                            key={roomId}
                            className={`border rounded p-3 transition-colors ${isDragOver ? "bg-blue-50 border-blue-300" : ""}`}
                            onDragOver={(e) => handleDragOverRoom(e, roomId)}
                            onDragEnter={(e) => handleDragOverRoom(e, roomId)}
                            onDragLeave={(e) => handleDragLeaveRoom(e, roomId)}
                            onDrop={(e) => handleDropToRoom(e, roomId)}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="font-medium">{roomName}</div>
                              <div className="text-sm text-slate-500">{items.length} suất</div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {items.length === 0 ? (
                                <div className="text-sm text-slate-400 p-2">Không có suất cho phòng này.</div>
                              ) : (
                                items.map((s) => (
                                  <button
                                    key={s.showtime_id}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, s)}
                                    onDragEnd={() => handleDragEnd()}
                                    onClick={() => onSelect?.(s)}
                                    className="text-left p-2 border cursor-pointer rounded hover:shadow-sm transition bg-white"
                                    title={`Kéo để di chuyển suất ${s.showtime_id}`}
                                  >
                                    <div className="font-medium">
                                      {s.movie_title ?? `Phim #${s.movie_id}`}
                                    </div>
                                    <div className="text-xs text-slate-500">
                                      từ <strong>{s.screening_start ?? fmtDate(s.start_date)}</strong> đến <strong>{s.screening_end ?? fmtDate(s.end_date)}</strong>
                                    </div>
                                    <div className="text-xs mt-1">
                                      <span className={`px-2 py-0.5 rounded text-xs ${s.status === 1 ? "bg-green-100" : "bg-slate-100"}`}>
                                        {s.status === 1 ? "Đang chiếu" : s.status === 0 ? "Sắp chiếu" : "Khác"}
                                      </span>
                                    </div>
                                  </button>
                                ))
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
