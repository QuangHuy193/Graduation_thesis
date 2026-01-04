import React, { useCallback, useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import { getAllBookings, refundBookingAgent } from "@/lib/axios/admin/bookingAPI";
type UserLite = {
    user_id: number;
    name?: string;
    email?: string;
};

type ShowtimeLite = {
    showtime_id: number;
    date?: string;
    cinema_name?: string;
};
type SeatLite = {
    seat_row: string;
    seat_column: string;
}
type MovieScreenLite = {
    start_time: string;
    end_time: string;
}
export type BookingItem = {
    movie_screening?: MovieScreenLite;
    movie?: string;
    room?: string;
    cinema?: string;
    booking_id: number;
    total_price: number;
    booking_time: string; // ISO string
    status: number; // e.g. 0: pending, 1: confirmed, 2: refunded, 3: cancelled
    payment_method?: string | null;
    refund_all?: 0 | 1 | null;
    refund_all_time?: string | null;
    user?: UserLite | null;
    voucher_id?: number | null;
    showtime?: ShowtimeLite | null;
    seats?: SeatLite[] | null;
};

function fmtCurrency(v?: number) {
    if (v == null) return "-";
    return v.toLocaleString("vi-VN", { style: "currency", currency: "VND" });
}
function fmtDateTime(iso?: string | null) {
    if (!iso) return "-";
    try {
        return new Date(iso).toLocaleString();
    } catch {
        return iso;
    }
}
type Props = { bookings?: BookingItem[]; initial?: BookingItem[]; onUpdateRefund?: () => void };
export default function BookingsTable({ bookings: propBookings = [], initial = [] as BookingItem[], onUpdateRefund }: Props) {
    const [bookings, setBookings] = useState<BookingItem[]>(propBookings || initial);
    const [loading, setLoading] = useState(false);

    // controls
    const [query, setQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>(""); // "" = all
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [total, setTotal] = useState(0);
    const [sortBy, setSortBy] = useState<"booking_time" | "total_price">("booking_time");
    const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

    // detail modal
    const [selected, setSelected] = useState<BookingItem | null>(null);
    useEffect(() => {
        setBookings(propBookings || initial || []);
    }, [propBookings, initial]);


    async function doRefund(bookingId: number) {
        const ok = await Swal.fire({
            title: "Hoàn tiền ?",
            text: `Bạn có chắc muốn hoàn tiền ?`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Có, hoàn tiền",
            cancelButtonText: "Hủy",
        });
        if (!ok.isConfirmed) return;

        try {
            const res: any = await refundBookingAgent(bookingId);
            if (!res?.success) throw new Error("Refund failed");
            onUpdateRefund?.();
            Swal.fire("Thành công", "Đã hoàn tiền", "success");
        } catch (err: any) {
            console.error(err);
            Swal.fire("Lỗi", err?.message || "Không thể hoàn tiền", "error");
        }
    }

    async function changeStatus(bookingId: number, newStatus: number) {
        const confirm = await Swal.fire({
            title: "Thay đổi trạng thái",
            text: `Bạn muốn đổi trạng thái booking #${bookingId} thành ${newStatus}?`,
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "Đổi",
        });
        if (!confirm.isConfirmed) return;

        try {
            const res = await fetch(`/api/admin/bookings/${bookingId}/status`, {
                method: "PATCH",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            });
            const j = await res.json();
            if (!res.ok) throw new Error(j?.error || "Update failed");
            Swal.fire("OK", "Đã cập nhật", "success");

        } catch (err: any) {
            console.error(err);
            Swal.fire("Lỗi", err?.message || "Không thể cập nhật trạng thái", "error");
        }
    }
    function getDateOnly(iso?: string | null) {
        if (!iso) return "-";
        return new Date(iso).toLocaleDateString("vi-VN"); // YYYY-MM-DD
    }

    // client-side filter + sort + paginate (giống cách movietable làm)
    const filteredSorted = useMemo(() => {
        // start from full fetched bookings
        let list = (bookings || []).slice();


        const q = (query || "").trim().toLowerCase();
        if (q) {
            list = list.filter((b) => {
                const idMatch = String(b.booking_id).includes(q);
                const userMatch = (b.user?.name || "").toLowerCase().includes(q);
                const emailMatch = (b.user?.email || "").toLowerCase().includes(q);
                const movieMatch = (b.movie || "").toLowerCase().includes(q);
                const seatsMatch = (b.seats || []).some(seat =>
                    `${seat.seat_row}${seat.seat_column}`
                        .toLowerCase()
                        .includes(q)
                );
                return idMatch || userMatch || movieMatch || seatsMatch || emailMatch;
            });
        }

        // status filter
        if (statusFilter !== "" && typeof statusFilter !== "undefined") {
            const st = Number(statusFilter);
            if (!Number.isNaN(st)) {
                list = list.filter((b) => Number(b.status) === st);
            }
        }

        // sort
        const dir = sortDir === "asc" ? 1 : -1;
        list.sort((a, b) => {
            if (sortBy === "total_price") {
                return dir * ((a.total_price ?? 0) - (b.total_price ?? 0));
            }
            // default: booking_time
            const ta = a.booking_time ? new Date(a.booking_time).getTime() : 0;
            const tb = b.booking_time ? new Date(b.booking_time).getTime() : 0;
            return dir * (ta - tb);
        });

        return list;
    }, [bookings, query, statusFilter, sortBy, sortDir]);

    const totalFiltered = filteredSorted.length;
    const pages = Math.max(1, Math.ceil(totalFiltered / perPage));
    const start = (page - 1) * perPage;
    const paginated = filteredSorted.slice(start, start + perPage);


    const STATUS_CONFIG: Record<number, { text: string; className: string }> = {
        0: {
            text: "Chưa thanh toán",
            className: "bg-yellow-100 text-yellow-800",
        },
        1: {
            text: "Đã thanh toán",
            className: "bg-green-100 text-green-700",
        },
        3: {
            text: "Chờ hoàn tiền",
            className: "bg-orange-100 text-orange-700",
        },
        4: {
            text: "Đã hoàn tiền",
            className: "bg-blue-100 text-blue-700",
        },
    };


    // CSV Export (current list)
    const exportCSV = () => {
        const rows = [
            ["Mã", "Phim", "Ghế", "Giá", "Khách", "Thời gian", "Trạng thái", "Thanh toán"]
        ];
        filteredSorted.forEach(b => {
            rows.push([
                String(b.booking_id),
                b.movie || "-",
                (b.seats || [])
                    .map(s => `${s.seat_row}${s.seat_column}`)
                    .join(", "),
                String(b.total_price),
                b.user?.name || b.user?.email || "-",
                b.booking_time,
                STATUS_CONFIG[b.status]?.text,
                b.payment_method || "-"
            ]);
        });

        const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `bookings_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="bg-white rounded shadow p-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                    <input
                        placeholder="Tìm mã, phim, khách, ghế..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="border rounded px-3 py-2 text-sm w-64"
                    />
                    <select className="border rounded px-2 py-2 text-sm cursor-pointer"
                        value={statusFilter}
                        onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
                        <option value="">Tất cả</option>
                        <option value="0">Chờ thanh toán</option>
                        <option value="1">Xác nhận</option>
                        <option value="2">Hoàn tiền</option>
                        <option value="3">Hủy</option>
                    </select>
                    <select className="border rounded px-2 py-2 text-sm cursor-pointers" value={perPage} onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }}>
                        <option value={10}>10 / trang</option>
                        <option value={25}>25 / trang</option>
                        <option value={50}>50 / trang</option>
                    </select>
                </div>

                <div className="flex items-center gap-2">
                    <label className="text-sm">Sắp xếp:</label>
                    <select className="border rounded px-2 py-2 text-sm cursor-pointer" value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}>
                        <option value="booking_time">Thời gian đặt</option>
                        <option value="total_price">Tổng tiền</option>
                    </select>
                    <button onClick={() => setSortDir(d => d === "asc" ? "desc" : "asc")} className="px-3 py-1 border rounded text-sm">
                        {sortDir === "asc" ? "⤴️" : "⤵️"}
                    </button>

                    <button className="px-3 py-1 border rounded text-sm cursor-pointer" onClick={exportCSV}>Xuất CSV</button>
                    <button className="px-3 py-1 border rounded text-sm cursor-pointer" onClick={() => setPage(1)}>
                        Tải lại
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full table-auto">
                    <thead className="bg-slate-50">
                        <tr>
                            {/* <th className="text-left px-4 py-3">Mã</th> */}
                            <th className="text-left px-4 py-3">Phim / Suất</th>
                            <th className="text-left px-4 py-3">Ghế</th>
                            <th className="text-left px-4 py-3">Giá</th>
                            <th className="text-left px-4 py-3">Khách</th>
                            <th className="text-left px-4 py-3">Thời gian</th>
                            <th className="text-left px-4 py-3">Trạng thái</th>
                            <th className="text-right px-4 py-3">Hành động</th>
                        </tr>
                    </thead>

                    <tbody>
                        {loading ? (
                            <tr><td colSpan={8} className="p-6 text-center">Loading...</td></tr>
                        ) : paginated.length === 0 ? (
                            <tr><td colSpan={8} className="p-6 text-center text-slate-500">Không có đặt vé</td></tr>
                        ) : paginated.map(b => (
                            <tr key={b.booking_id} className="border-t hover:bg-slate-50">
                                {/* <td className="px-4 py-3">{b.booking_id}</td> */}
                                <td className="px-4 py-3 max-w-[320px]">
                                    {/* Tên phim */}
                                    <div className="font-medium truncate">
                                        {b.movie || "-"}
                                    </div>

                                    {/* Rạp + phòng */}
                                    <div className="text-xs text-slate-500 truncate">
                                        {b.cinema || ""} • {b.room || ""}
                                    </div>

                                    {/* Ngày + giờ chiếu */}
                                    <div className="mt-1 flex flex-wrap gap-1">
                                        <span className="px-2 py-0.5 rounded bg-slate-100 text-[11px] text-slate-600">
                                            {getDateOnly(b.showtime?.date || "")}
                                        </span>

                                        {b.movie_screening?.start_time && b.movie_screening?.end_time && (
                                            <span className="px-2 py-0.5 rounded bg-blue-50 text-[11px] text-blue-700">
                                                {b.movie_screening.start_time.slice(0, 5)}- {b.movie_screening.end_time.slice(0, 5)}
                                            </span>
                                        )}
                                    </div>
                                </td>

                                <td className="px-4 py-3">
                                    {(b.seats && b.seats.length > 0)
                                        ? b.seats.map(s => `${s.seat_row}${s.seat_column}`).join(", ")
                                        : "-"}
                                </td>

                                <td className="px-4 py-3">{fmtCurrency(b.total_price)}</td>
                                <td className="px-4 py-3">{b.user?.name || b.user?.email || "-"}</td>
                                <td className="px-4 py-3">{fmtDateTime(b.booking_time)}</td>
                                <td className="px-4 py-3">
                                    <span
                                        className={`inline-block text-xs px-2 py-1 rounded-full font-medium
      ${STATUS_CONFIG[b.status]?.className || "bg-slate-100 text-slate-600"}
    `}
                                    >
                                        {STATUS_CONFIG[b.status]?.text || "Khác"}
                                    </span>
                                </td>

                                <td className="px-4 py-3 text-right">
                                    <div className="inline-flex gap-2">
                                        <button className="px-3 py-1 border rounded text-sm cursor-pointer" onClick={() => setSelected(b)}>Chi tiết</button>
                                        {b.status === 1 && (
                                            <button className="px-3 py-1 border rounded text-sm text-red-600 cursor-pointer" onClick={() => doRefund(b.booking_id)}>Hoàn tiền</button>
                                        )}
                                        {/* <div className="relative inline-block">
                                            <select className="border rounded px-2 py-1 text-sm" onChange={(e) => changeStatus(b.booking_id, Number(e.target.value))} defaultValue="">
                                                <option value="">Đổi trạng thái</option>
                                                <option value="0">Chờ thanh toán</option>
                                                <option value="1">Xác nhận</option>
                                                <option value="2">Hoàn tiền</option>
                                                <option value="3">Hủy</option>
                                            </select>
                                        </div> */}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* pagination */}
            <div className="p-4 flex items-center justify-between">
                <div className="text-sm text-slate-600">Hiển thị {(page - 1) * perPage + 1} - {Math.min(start + perPage, totalFiltered)} / {totalFiltered}</div>
                <div className="flex items-center gap-2">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} className="px-3 py-1 border rounded" disabled={page === 1}>Prev</button>
                    <div className="text-sm">{page} / {pages}</div>
                    <button onClick={() => setPage(p => Math.min(pages, p + 1))} className="px-3 py-1 border rounded" disabled={page === pages}>Next</button>
                </div>
            </div>

            {/* detail modal */}
            {selected && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full overflow-hidden">

                        {/* ===== Header ===== */}
                        <div className="px-5 py-4 border-b flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-semibold">🎟️ Chi tiết đơn đặt vé</h3>
                                <p className="text-xs text-slate-500">Mã đơn: #{selected.booking_id}</p>
                            </div>

                            <span
                                className={`text-xs px-3 py-1 rounded-full font-medium
          ${STATUS_CONFIG[selected.status]?.className || "bg-slate-100 text-slate-600"}
        `}
                            >
                                {STATUS_CONFIG[selected.status]?.text || "Khác"}
                            </span>
                        </div>

                        {/* ===== Content ===== */}
                        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">

                            {/* ===== Cột trái ===== */}
                            <div className="space-y-4">
                                <div>
                                    <div className="text-xs text-slate-500">👤 Khách hàng</div>
                                    <div className="font-medium">
                                        {selected.user?.name || selected.user?.email || "-"}
                                    </div>
                                </div>

                                <div>
                                    <div className="text-xs text-slate-500">💳 Phương thức thanh toán</div>
                                    <div>{selected.payment_method || "-"}</div>
                                </div>

                                <div>
                                    <div className="text-xs text-slate-500">💰 Tổng tiền</div>
                                    <div className="text-base font-semibold text-green-600">
                                        {fmtCurrency(selected.total_price)}
                                    </div>
                                </div>

                                <div>
                                    <div className="text-xs text-slate-500">🕒 Thời gian đặt</div>
                                    <div>{fmtDateTime(selected.booking_time)}</div>
                                </div>
                            </div>

                            {/* ===== Cột phải ===== */}
                            <div className="space-y-4">
                                <div>
                                    <div className="text-xs text-slate-500">🎬 Phim</div>
                                    <div className="font-medium">{selected.movie || "-"}</div>
                                    <div className="text-xs text-slate-500 mt-1">
                                        {selected.cinema || ""} • {selected.room || ""} •{" "}
                                        {getDateOnly(selected.showtime?.date || "")}
                                    </div>
                                </div>

                                <div>
                                    <div className="text-xs text-slate-500">💺 Ghế đã chọn</div>
                                    <div className="flex flex-wrap gap-2 mt-1">
                                        {(selected.seats && selected.seats.length > 0)
                                            ? selected.seats.map((s, idx) => (
                                                <span
                                                    key={idx}
                                                    className="px-2 py-1 rounded-md text-xs bg-slate-100 border"
                                                >
                                                    {s.seat_row}{s.seat_column}
                                                </span>
                                            ))
                                            : <span>-</span>}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ===== Footer ===== */}
                        <div className="px-5 py-3 border-t flex justify-end">
                            <button
                                onClick={() => setSelected(null)}
                                className="px-4 py-2 border rounded-lg text-sm hover:bg-slate-50 cursor-pointer"
                            >
                                Đóng
                            </button>
                        </div>

                    </div>
                </div>

            )}
        </div>
    );
}
