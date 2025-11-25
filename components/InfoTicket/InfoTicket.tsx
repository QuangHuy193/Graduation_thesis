"use client";
import { useEffect, useRef, useState } from "react";
// import Image from "next/image"; // NOTE: dùng <img> thay vì Next/Image cho dom-to-image-more
import { getTicketByBokingIdAPI } from "@/lib/axios/ticketAPI";

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

  // helper: chuyển HTML element thành PNG và tải về (dùng dom-to-image-more)
  async function downloadElementAsImage(
    el: HTMLElement,
    filename = "ticket.png"
  ) {
    try {
      const domtoimage = (await import("dom-to-image-more")).default;
      const options: any = {
        bgcolor: "#ffffff",
        quality: 1,
        // useCORS không phải option của dom-to-image-more, but it handles CORS internally.
        // Nhưng cần đảm bảo <img crossOrigin="anonymous" /> và server ảnh có header CORS.
      };

      // toPng trả về dataURL
      const dataUrl = await domtoimage.toPng(el, options);

      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error("dom-to-image-more error:", err);
      alert("Không thể tạo ảnh vé. Kiểm tra console để biết chi tiết.");
    }
  }

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
        className="bg-white rounded-xl shadow-md p-4 w-[600px] text-gray-900"
      >
        <div className="flex gap-4">
          <div className="flex-1">
            <div className="text-lg font-bold mb-1">{t.name}</div>
            <div className="text-sm text-gray-600">
              <div>
                Ngày: <strong>{t.showtime_date}</strong>
              </div>
              <div>
                Giờ: <strong>{t.start_time}</strong>
              </div>
              <div>
                Ghế: <strong>{seat}</strong>
              </div>
            </div>
            <div className="mt-3 text-xs text-gray-500">
              Vui lòng xuất trình mã QR hoặc ảnh này khi vào rạp.
            </div>
          </div>

          <div className="w-[160px] h-[160px] flex items-center justify-center bg-gray-100 rounded">
            {/* DÙNG <img> để dom-to-image-more hoạt động tốt */}
            {/* Nếu qr_code là URL remote, đảm bảo server ảnh trả header CORS (Access-Control-Allow-Origin: *) */}
            <img
              src={t.qr_code}
              alt={`qr-${idx}`}
              width={120}
              height={120}
              className="w-36 h-36"
              crossOrigin="anonymous"
              onError={(e) => {
                // fallback: nếu ảnh lỗi, hide hoặc show placeholder
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          <button
            onClick={handleDownloadAll}
            className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-60"
            disabled={tickets.length === 0}
          >
            Tải toàn bộ danh sách
          </button>
        </div>
      </div>

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
                className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
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
