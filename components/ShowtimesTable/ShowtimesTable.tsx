// components/ShowtimeTimetable/ShowtimeTimetable.tsx
"use client";

import React, { useMemo, useState } from "react";

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
};

type MovieLite = { movie_id: number; title?: string };
type RoomLite = { room_id: number; name?: string };

type Props = {
  showtimes?: ShowtimeRaw[];
  moviesMap?: Record<number, MovieLite>;
  roomsMap?: Record<number, RoomLite>;
  onSelect?: (st: ShowtimeRaw) => void;
  // optional initial date to focus (ISO date string yyyy-mm-dd)
  initialDate?: string | null;
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

    // Lấy ngày / tháng / năm
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();

    return `${day}-${month}-${year}`;
  } catch {
    return dateStr;
  }
}


export default function Showtimestable({
  showtimes = [],
  moviesMap = {},
  roomsMap = {},
  onSelect,
  initialDate = null,
}: Props) {
  const [filterMovie, setFilterMovie] = useState<string>(""); // movie_id as string
  const [activeDate, setActiveDate] = useState<string | null>(initialDate);

  // build movie options from showtimes + moviesMap
  const movieOptions = useMemo(() => {
    const map = new Map<number, string>();
    (showtimes || []).forEach((s) => {
      const mid = Number(s.movie_id ?? 0);
      if (!mid) return;
      const title = s.movie_title ?? moviesMap[mid]?.title ?? `Phim #${mid}`;
      map.set(mid, title);
    });
    return Array.from(map.entries()).map(([id, title]) => ({ id, title }));
  }, [showtimes, moviesMap]);

  // group showtimes by date -> room
  const grouped = useMemo(() => {
    const g: Record<
      string,
      Record<string, ShowtimeRaw[]>
    > = {}; // date -> roomId -> list
    for (const s of showtimes || []) {
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
  }, [showtimes]);

  // sorted date keys (asc)
  const dateKeys = useMemo(() => {
    const keys = Object.keys(grouped).filter(k => k !== "unknown");
    keys.sort((a, b) => (a > b ? 1 : -1));
    // keep unknown at end
    if (grouped["unknown"]) keys.push("unknown");
    return keys;
  }, [grouped]);

  // if activeDate not set, pick first
  React.useEffect(() => {
    if (!activeDate && dateKeys.length) setActiveDate(dateKeys[0]);
  }, [dateKeys, activeDate]);

  // filtered rooms/time lists for activeDate
  const roomsForActive = useMemo(() => {
    if (!activeDate) return {};
    const byRoom = grouped[activeDate] || {};
    // apply movie filter: if filterMovie set, filter showtimes that match movie id
    if (!filterMovie) return byRoom;
    const mid = Number(filterMovie);
    const out: Record<string, ShowtimeRaw[]> = {};
    for (const r of Object.keys(byRoom)) {
      const filtered = byRoom[r].filter(s => Number(s.movie_id ?? 0) === mid);
      if (filtered.length) out[r] = filtered;
    }
    return out;
  }, [activeDate, grouped, filterMovie]);


  return (
    <div className="bg-white rounded shadow p-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <label className="text-sm">Ngày:</label>
          <select
            className="border rounded px-2 py-1"
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
            className="border rounded px-2 py-1"
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

          <button
            onClick={() => { setFilterMovie(""); setActiveDate(dateKeys[0] ?? null); }}
            className="px-2 py-1 border rounded text-sm"
          >
            Reset
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-sm text-slate-600">Tổng suất: {showtimes?.length ?? 0}</div>

        </div>
      </div>

      {!activeDate ? (
        <div className="p-6 text-center text-slate-500">Không có suất chiếu</div>
      ) : (
        <div>
          <h3 className="font-medium mb-2">Suất chiếu ngày {activeDate}</h3>

          {/* rooms list */}
          <div className="space-y-4">
            {Object.keys(roomsForActive).length === 0 ? (
              <div className="text-sm text-slate-500 p-4">Không có suất phù hợp</div>
            ) : (
              Object.entries(roomsForActive).map(([roomId, items]) => {
                const roomName = roomsMap && roomsMap[Number(roomId)]?.name
                  || items[0]?.room_name
                  || `Phòng ${roomId}`;

                return (
                  <div key={roomId} className="border rounded p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium">{roomName}</div>
                      <div className="text-sm text-slate-500">{items.length} suất</div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">

                      {items.map((s) => (
                        <button
                          key={s.showtime_id}
                          onClick={() => onSelect?.(s)}
                          className="text-left p-2 border rounded hover:shadow-sm transition"
                        >
                          <div className="font-medium">{s.movie_title ?? moviesMap[Number(s.movie_id)]?.title ?? `Phim #${s.movie_id}`}</div>
                          <div className="text-xs text-slate-500">
                            từ <strong>{s.screening_start}</strong> đến <strong>{s.screening_end}</strong>
                          </div>
                          <div className="text-xs mt-1">
                            <span className={`px-2 py-0.5 rounded text-xs ${s.status === 1 ? "bg-green-100" : "bg-slate-100"}`}>
                              {s.status === 1 ? "Đang chiếu" : s.status === 0 ? "Sắp chiếu" : "Khác"}
                            </span>
                          </div>
                        </button>
                      ))}
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
