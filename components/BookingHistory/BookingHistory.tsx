"use client";

export default function BookingHistory({ bookings = [] }) {
    const fmtDate = (iso) => {
        if (!iso) return "-";
        try {
            const d = new Date(iso);
            return d.toLocaleString("vi-VN", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            });
        } catch {
            return iso;
        }
    };

    const fmtCurrency = (value) => {
        if (value == null) return "-";
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
        }).format(value);
    };

    return (
        <div className="w-full text-white">
            {/* Title */}
            <h3 className="text-xl font-extrabold mb-4">Lịch sử mua vé</h3>

            {/* Empty state */}
            {bookings.length === 0 ? (
                <div className="p-6 bg-[#111827] border border-gray-700 rounded-lg text-gray-400 text-center">
                    Bạn chưa có giao dịch nào.
                </div>
            ) : (
                <div className="w-full bg-[#0f172a] border border-gray-700 rounded-xl shadow-xl overflow-hidden">
                    <table className="w-full table-auto text-sm">
                        <thead className="bg-[#1e293b] text-gray-300">
                            <tr>
                                <th className="p-3 text-left font-semibold">Mã đơn</th>
                                <th className="p-3 text-left font-semibold">Tên phim</th>
                                <th className="p-3 text-left font-semibold">Rạp</th>
                                <th className="p-3 text-left font-semibold">Thời gian</th>
                                <th className="p-3 text-right font-semibold">Số tiền</th>
                            </tr>
                        </thead>

                        <tbody>
                            {bookings.map((b) => (
                                <tr
                                    key={b.booking_id}
                                    className="border-b border-gray-700 hover:bg-[#1e293b]/60 transition"
                                >
                                    <td className="p-3 font-bold text-blue-300 break-words">
                                        {b.booking_id}
                                    </td>

                                    <td className="p-3 font-medium text-gray-200 break-words">
                                        {b.movie}
                                    </td>

                                    <td className="p-3 text-gray-300 break-words">
                                        {b.cinema}
                                    </td>

                                    <td className="p-3 text-gray-300 break-words">
                                        {fmtDate(b.booking_time)}
                                    </td>

                                    <td className="p-3 text-right font-bold text-yellow-300">
                                        {fmtCurrency(b.total_price)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
