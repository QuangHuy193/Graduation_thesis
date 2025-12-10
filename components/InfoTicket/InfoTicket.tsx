"use client";

import { useEffect, useRef, useState } from "react";
import { getTicketByBokingIdAPI } from "@/lib/axios/ticketAPI";
import { downloadElementAsImage, fmtCurrency } from "@/lib/function";
import Image from "next/image";

type TicketItem = {
  showtime_date: string;
  seat_row: string;
  seat_column: string;
  name: string; // phòng
  start_time: string;
  qr_code: string; // data url hoặc public url
  ticketId: number;
};

export default function InfoTicket({ bookingId }: { bookingId: number }) {
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // refs: mỗi ticket 1 ref để chụp riêng; wrapRef để chụp toàn bộ danh sách
  const ticketRefs = useRef<Array<HTMLDivElement | null>>([]);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let mounted = true;
    async function fetchTickets() {
      setLoading(true);
      try {
        const res = await getTicketByBokingIdAPI(bookingId);
        console.log(res);
        const data = res?.data ?? res;
        if (mounted) {
          setTickets(Array.isArray(data) ? data : []);
        }
      } catch (err: any) {
        console.error(err);
        if (mounted) setError(err?.message ?? "Lỗi khi lấy vé");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchTickets();
    return () => {
      mounted = false;
    };
  }, [bookingId]);

  const handleDownloadSingle = (index: number) => {
    const el = ticketRefs.current[index];
    if (!el) return alert("Không tìm thấy vé để tải.");
    const seatLabel = `${tickets[index].seat_row}${tickets[index].seat_column}`;
    downloadElementAsImage(el, `ticket-${seatLabel}.png`);
  };

  const handleDownloadAll = () => {
    if (!wrapRef.current) return alert("Không tìm thấy nội dung để tải.");
    downloadElementAsImage(
      wrapRef.current,
      `tickets-${bookingId ?? "list"}.png`
    );
  };

  // Render ticket card (dùng <img> thay vì next/image để dom-to-image-more chụp chính xác)
  function TicketCard({ t, idx }: { t: TicketItem; idx: number }) {
    const seat = `${t.seat_row}${t.seat_column}`;
    return (
      <div
        ref={(el) => (ticketRefs.current[idx] = el)}
        key={t.ticket_id}
        id={`ticket-${t.ticket_id}`}
        className="border border-gray-700 rounded-lg p-4 bg-[#0f172a]
        no-capture-selection w-[500px]"
      >
        <div className="flex flex-col sm:flex-row sm:justify-between">
          <div>
            <div className="text-gray-300 text-sm">
              Mã vé:{" "}
              <span className="text-blue-300 font-semibold">{t.ticket_id}</span>
            </div>

            <div className="mt-2 text-gray-300 text-sm">
              Lịch chiếu:{" "}
              <span className="text-white font-semibold">
                {t.start_time} {t.showtime_date} {t.name}
              </span>
            </div>

            <div className="mt-2 text-gray-300 text-sm">
              Ghế: <span className="text-white font-semibold">{seat}</span>
            </div>
            <div className="mt-4 sm:mt-0">
              <div className="text-gray-300 text-sm mb-1">
                Danh sách đồ ăn, thức uống:
              </div>

              {t.foods?.map((f, idx) => (
                <div key={idx} className="text-gray-400">
                  • {f.food_name} x {f.quantity}
                </div>
              ))}
            </div>

            <div className="mt-1 text-gray-300 text-sm">
              Tổng tiền của vé:{" "}
              <span className="text-yellow-300 font-bold">
                {fmtCurrency(t.total_price)}
              </span>
            </div>
          </div>

          <div>
            <div className="text-gray-300 text-sm mb-1">Mã QR:</div>
            <Image src={t.qr_code} alt="Mã QR" height={100} width={100} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      {loading && <div>Đang tải vé...</div>}
      {error && <div className="text-red-500">Lỗi: {error}</div>}

      {!loading && tickets.length === 0 && (
        <div className="text-gray-500">Chưa có vé để hiển thị.</div>
      )}

      <div ref={wrapRef} className="flex flex-col gap-4">
        {tickets.map((t, idx) => (
          <div key={idx} className="flex items-center gap-4">
            <TicketCard t={t} idx={idx} />
            <div className="flex flex-col gap-2">
              <button
                onClick={() => handleDownloadSingle(idx)}
                className="px-3 py-2 bg-blue-600 text-white rounded cursor-pointer
                 hover:bg-blue-700"
              >
                Tải vé
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
