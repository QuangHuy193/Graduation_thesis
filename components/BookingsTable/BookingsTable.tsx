import React, { useCallback, useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import { getAllBookings } from "@/lib/axios/admin/bookingAPI";
type UserLite = {
    user_id: number;
    name?: string;
    email?: string;
};

type ShowtimeLite = {
    showtime_id: number;
    movie_title?: string;
    start_time?: string | null;
    cinema_name?: string;
};

export type BookingItem = {
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
    seats?: string[]; // ['A1','A2']
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
type Props = { bookings?: BookingItem[]; initial?: BookingItem[] };
export default function BookingsTable({ bookings: propBookings = [], initial = [] as BookingItem[] }: Props) {
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
            title: "Hoàn tiền toàn bộ?",
            text: `Bạn có chắc muốn hoàn tiền toàn bộ cho booking #${bookingId}?`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Có, hoàn tiền",
            cancelButtonText: "Hủy",
        });
        if (!ok.isConfirmed) return;

        try {
            const res = await fetch(`/api/admin/bookings/${bookingId}/refund`, { method: "POST" });
            const j = await res.json();
            if (!res.ok) throw new Error(j?.error || "Refund failed");
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

    // client-side filter + sort + paginate (giống cách movietable làm)
    const filteredSorted = useMemo(() => {
        // start from full fetched bookings
        let list = (bookings || []).slice();


        const q = (query || "").trim().toLowerCase();
        if (q) {
            list = list.filter((b) => {
                const idMatch = String(b.booking_id).includes(q);
                const userMatch = (b.user?.name || b.user?.email || "").toLowerCase().includes(q);
                const movieMatch = (b.showtime?.movie_title || "").toLowerCase().includes(q);
                const seatsMatch = (b.seats || []).some((s) => String(s).toLowerCase().includes(q));
                return idMatch || userMatch || movieMatch || seatsMatch;
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


    const statusText = (s?: number) => {
        switch (s) {
            case 0: return "Chờ thanh toán";
            case 1: return "Xác nhận";
            case 2: return "Hoàn tiền";
            case 3: return "Hủy";
            default: return "Khác";
        }
    };
    console.log("Showtimetable props:", {
        isArray: Array.isArray(showtimes),
        len: Array.isArray(showtimes) ? showtimes.length : null,
        sample: Array.isArray(showtimes) && showtimes.length ? showtimes[0] : showtimes
    });

    // CSV Export (current list)
    const exportCSV = () => {
        const rows = [
            ["Mã", "Phim", "Ghế", "Giá", "Khách", "Thời gian", "Trạng thái", "Thanh toán"]
        ];
        filteredSorted.forEach(b => {
            rows.push([
                String(b.booking_id),
                b.showtime?.movie_title || "-",
                (b.seats || []).join(", "),
                String(b.total_price),
                b.user?.name || b.user?.email || "-",
                b.booking_time,
                statusText(b.status),
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
                    <select className="border rounded px-2 py-2 text-sm"
                        value={statusFilter}
                        onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
                        <option value="">Tất cả</option>
                        <option value="0">Chờ thanh toán</option>
                        <option value="1">Xác nhận</option>
                        <option value="2">Hoàn tiền</option>
                        <option value="3">Hủy</option>
                    </select>
                    <select className="border rounded px-2 py-2 text-sm" value={perPage} onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }}>
                        <option value={10}>10 / trang</option>
                        <option value={25}>25 / trang</option>
                        <option value={50}>50 / trang</option>
                    </select>
                </div>

                <div className="flex items-center gap-2">
                    <label className="text-sm">Sắp xếp:</label>
                    <select className="border rounded px-2 py-2 text-sm" value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}>
                        <option value="booking_time">Thời gian đặt</option>
                        <option value="total_price">Tổng tiền</option>
                    </select>
                    <button onClick={() => setSortDir(d => d === "asc" ? "desc" : "asc")} className="px-3 py-1 border rounded text-sm">
                        {sortDir === "asc" ? "⤴️" : "⤵️"}
                    </button>

                    <button className="px-3 py-1 border rounded text-sm" onClick={exportCSV}>Xuất CSV</button>
                    <button className="px-3 py-1 border rounded text-sm" onClick={() => setPage(1)}>
                        Tải lại
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full table-auto">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="text-left px-4 py-3">Mã</th>
                            <th className="text-left px-4 py-3">Phim / Showtime</th>
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
                                <td className="px-4 py-3">{b.booking_id}</td>
                                <td className="px-4 py-3">
                                    <div className="font-medium">{b.showtime?.movie_title || "-"}</div>
                                    <div className="text-xs text-slate-500">{b.showtime?.cinema_name || ""} • {fmtDateTime(b.showtime?.start_time || "")}</div>
                                </td>
                                <td className="px-4 py-3">{(b.seats || []).join(", ") || "-"}</td>
                                <td className="px-4 py-3">{fmtCurrency(b.total_price)}</td>
                                <td className="px-4 py-3">{b.user?.name || b.user?.email || "-"}</td>
                                <td className="px-4 py-3">{fmtDateTime(b.booking_time)}</td>
                                <td className="px-4 py-3">
                                    <span className="inline-block text-xs px-2 py-1 rounded-full bg-slate-100">
                                        {statusText(b.status)}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <div className="inline-flex gap-2">
                                        <button className="px-3 py-1 border rounded text-sm" onClick={() => setSelected(b)}>Chi tiết</button>
                                        {b.status !== 2 && (
                                            <button className="px-3 py-1 border rounded text-sm text-red-600" onClick={() => doRefund(b.booking_id)}>Refund</button>
                                        )}
                                        <div className="relative inline-block">
                                            <select className="border rounded px-2 py-1 text-sm" onChange={(e) => changeStatus(b.booking_id, Number(e.target.value))} defaultValue="">
                                                <option value="">Đổi trạng thái</option>
                                                <option value="0">Chờ thanh toán</option>
                                                <option value="1">Xác nhận</option>
                                                <option value="2">Hoàn tiền</option>
                                                <option value="3">Hủy</option>
                                            </select>
                                        </div>
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
                    <div className="bg-white rounded shadow max-w-2xl w-full overflow-hidden">
                        <div className="p-3 flex justify-between items-center border-b">
                            <div className="font-medium">Booking #{selected.booking_id} — Chi tiết</div>
                            <button onClick={() => setSelected(null)} className="px-3 py-1 border rounded">Đóng</button>
                        </div>

                        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <div className="text-xs text-slate-500">Khách</div>
                                <div className="font-medium">{selected.user?.name || selected.user?.email || "-"}</div>
                                <div className="text-xs text-slate-500 mt-2">Phương thức</div>
                                <div>{selected.payment_method || "-"}</div>

                                <div className="text-xs text-slate-500 mt-2">Tổng giá</div>
                                <div className="font-medium">{fmtCurrency(selected.total_price)}</div>

                                <div className="text-xs text-slate-500 mt-2">Trạng thái</div>
                                <div>{statusText(selected.status)}</div>
                            </div>

                            <div>
                                <div className="text-xs text-slate-500">Phim / Showtime</div>
                                <div className="font-medium">{selected.showtime?.movie_title || "-"}</div>
                                <div className="text-xs text-slate-500 mt-1">{selected.showtime?.cinema_name || ""} • {fmtDateTime(selected.showtime?.start_time || "")}</div>

                                <div className="text-xs text-slate-500 mt-3">Ghế</div>
                                <div>{(selected.seats || []).join(", ") || "-"}</div>

                                <div className="text-xs text-slate-500 mt-3">Booking time</div>
                                <div>{fmtDateTime(selected.booking_time)}</div>
                            </div>
                        </div>

                        <div className="p-3 border-t flex items-center justify-end gap-2">
                            {selected.status !== 2 && <button className="px-3 py-1 border rounded text-red-600" onClick={() => { doRefund(selected.booking_id); setSelected(null); }}>Hoàn tiền</button>}
                            <button className="px-3 py-1 border rounded" onClick={() => setSelected(null)}>Đóng</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
