"use client";
import { toPng } from "html-to-image";

import { cancelBookingAPI } from "@/lib/axios/bookingAPI";
import { fmtCurrency, getRefundPercent } from "@/lib/function";
import { faChevronDown } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { useState } from "react";
import Swal from "sweetalert2";
const BANKS = [
  { name: "Vietcombank", bin: "970436" },
  { name: "VietinBank", bin: "970415" },
  { name: "BIDV", bin: "970418" },
  { name: "ACB", bin: "970416" },
  { name: "MB Bank", bin: "970422" },
  { name: "Techcombank", bin: "970407" }
];

export default function BookingHistory({
  bookings = [],
  isCancelBooking,
  setIsCancelBooking,
}) {
  // mở vé của booking
  const [openId, setOpenId] = useState(-1);

  // lấy user
  const { data: session } = useSession();
  const user = session?.user;

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

  const handleCancelBooking = async (
    booking_id: number | string,
    date: Date,
    time: string
  ) => {
    // 1️⃣ Xác nhận hủy vé
    const result = await Swal.fire({
      icon: "warning",
      title: "Xác nhận hủy vé",
      html: `
      <p style="margin-bottom:10px">
        Việc hủy vé có thể làm bạn mất một phần giá trị vé theo quy định hoàn tiền.
      </p>
      <p style="font-size:13px;color:#666">
        💡 Tiền sẽ được hoàn về <b>tài khoản bạn đã dùng để thanh toán</b>.
      </p>
    `,
      showCancelButton: true,
      confirmButtonText: "ĐỒNG Ý HỦY",
      cancelButtonText: "GIỮ VÉ",
    });

    if (!result.isConfirmed) return;

    // 2️⃣ Tính % hoàn tiền (có xét VIP)
    const refundPercent = getRefundPercent(date, time, user?.vip);

    if (refundPercent === 0) {
      await Swal.fire({
        icon: "error",
        text: "Suất chiếu còn dưới 3 giờ nên không thể hủy vé!",
      });
      return;
    }

    try {
      setIsCancelBooking(booking_id);

      // 3️⃣ Gọi API hủy booking (KHÔNG truyền thông tin ngân hàng)
      const res = await cancelBookingAPI(booking_id, refundPercent);

      await Swal.fire({
        toast: true,
        position: "top-end",
        icon: res?.success ? "success" : "error",
        text: res?.success ? "Đã hủy đơn hàng" : "Hủy đơn hàng thất bại",
        showConfirmButton: false,
        timer: 2000,
      });
    } catch (error) {
      await Swal.fire({
        toast: true,
        position: "top-end",
        icon: "error",
        text: "Hủy đơn hàng thất bại",
        showConfirmButton: false,
        timer: 2000,
      });
      console.error(error);
    } finally {
      setIsCancelBooking(-1);
    }
  };


  // tải vé
  const downloadTicketImage = async (ticketId, label) => {
    // try exact id first, else fallback to id prefix (ticket-<id>-...)
    let node = document.getElementById(`ticket-${ticketId}`);
    if (!node) {
      node = document.querySelector(`[id^="ticket-${ticketId}-"]`);
    }
    if (!node) return;

    try {
      // 1) Blur active element (remove focus ring)
      if (
        document.activeElement &&
        typeof document.activeElement.blur === "function"
      ) {
        document.activeElement.blur();
      }

      // 2) Remove any selection (text highlight)
      const sel = window.getSelection?.();
      if (sel && sel.rangeCount > 0) {
        sel.removeAllRanges();
      }

      // 3) Also blur any focused descendants just in case
      node.querySelectorAll("*:focus").forEach((el) => {
        if (typeof el.blur === "function") el.blur();
      });

      // 4) Wait for fonts to be ready (avoid fallback font artifacts)
      if (document.fonts && typeof document.fonts.ready?.then === "function") {
        try {
          await document.fonts.ready;
        } catch (e) {
          // ignore font loading errors, continue
        }
      }

      // 5) Temporarily add a class to ensure no outlines / selection shown
      node.classList.add("no-capture-selection");

      // 6) Use html-to-image to capture. Provide width/height to preserve layout.
      const rect = node.getBoundingClientRect();
      const options = {
        bgcolor: null, // or '#0f172a' if you want forced background
        width: Math.ceil(rect.width),
        height: Math.ceil(rect.height),
        style: {
          // ensure consistent box-sizing & font smoothing
          "box-sizing": "border-box",
          "-webkit-font-smoothing": "antialiased",
          "-moz-osx-font-smoothing": "grayscale",
        },
        // filter: (n) => true, // default includes everything in node
      };

      const dataUrl = await toPng(node, options);

      // 7) cleanup class
      node.classList.remove("no-capture-selection");

      // 8) trigger download
      const link = document.createElement("a");
      link.download = `ticket_${ticketId}_${label}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      // make sure we remove temp class on error too
      try {
        node.classList.remove("no-capture-selection");
      } catch (e) { }
      console.error("Lỗi chụp ảnh (html-to-image):", error);
    }
  };

  return (
    <div className="w-full text-white">
      {/* Title */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-extrabold">Lịch sử mua vé</h3>

        <button
          onClick={() =>
            Swal.fire({
              title: "ĐIỀU KHOẢN HỦY VÉ",
              html: `
    <div style="text-align: left; font-size: 14px; line-height: 1.5;">
      <p><strong>Tiền hoàn lại được tính theo thời gian còn lại trước giờ chiếu:</strong></p>
      <ul style="margin-left: 16px;">
        <li><strong>Hủy trước 24 giờ:</strong> Hoàn 100% giá vé</li>
        <li><strong>12 giờ - 24 giờ:</strong> Hoàn 95%</li>
        <li><strong>6 giờ - 12 giờ:</strong> Hoàn 90%</li>
        <li><strong>3 giờ - 6 giờ:</strong> Hoàn 80%</li>
        <li><strong>Dưới 3 giờ:</strong> <span style="color:#f87171">Không hỗ trợ hủy vé</span></li>
      </ul>
      <p style="margin-top: 8px;"><strong>Thành viên VIP:</strong> +5% mức hoàn tại mỗi mốc (tối đa 100%).</p>
    </div>
  `,
              confirmButtonText: "ĐỒNG Ý",
              customClass: {
                popup: "popup_alert",
                confirmButton: `btn_alert`,
                cancelButton: `btn_alert`,
              },
            })
          }
          className="text-sm text-yellow-300 hover:underline cursor-pointer"
        >
          ĐIỀU KHOẢN HỦY VÉ
        </button>
      </div>

      {/* Empty state */}
      {bookings.length === 0 ? (
        <div className="p-6 bg-[#111827] border border-gray-700 rounded-lg text-gray-400 text-center">
          Bạn chưa có giao dịch nào.
        </div>
      ) : (
        <div className="w-full bg-[#0f172a] border border-gray-700 rounded-xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-6 bg-[#1e293b] text-gray-300 p-3 text-sm font-semibold">
            <div>Mã đơn</div>
            <div>Tên phim</div>
            <div>Rạp</div>
            <div className="text-center">Thời gian đặt</div>
            <div className="text-right">Số tiền</div>
            <div></div>
          </div>

          {/* Body */}
          <div>
            {bookings.map((b) => (
              <div key={b.booking_id} className="border-b border-gray-700">
                {/* Row */}
                <div
                  onClick={() =>
                    setOpenId(openId === b.booking_id ? null : b.booking_id)
                  }
                  className="grid grid-cols-6 p-3 text-sm cursor-pointer hover:bg-[#1e293b]/60 transition"
                >
                  <div className="font-bold text-blue-300 break-words">
                    {b.booking_id}
                  </div>
                  <div className="font-medium text-gray-200 break-words">
                    {b.movie}
                  </div>
                  <div className="text-gray-300 break-words">{b.cinema}</div>
                  <div className="text-gray-300 break-words text-center">
                    {fmtDate(b.booking_time)}
                  </div>
                  <div className="font-bold text-yellow-300 text-right">
                    {fmtCurrency(b.total_price)}
                  </div>

                  <div className="flex justify-between">
                    {/* Mũi tên gợi ý mở/đóng */}
                    <div className="pl-5">
                      <FontAwesomeIcon
                        icon={faChevronDown}
                        className={`w-4 h-4 text-yellow-300 transition-transform
                             duration-300 ${openId === b.booking_id
                            ? "rotate-180"
                            : "rotate-0"
                          }`}
                      />
                    </div>

                    {b.status === 0 && (
                      <div className="text-yellow-500">Chờ thanh toán</div>
                    )}

                    {b.status === 1 && (
                      <button
                        onClick={(e) => {
                          handleCancelBooking(
                            b.booking_id,
                            b.showtime_date,
                            b.start_time
                          );
                          e.stopPropagation(); // không toggle mở/đóng drawer
                        }}
                        className="h-fit px-3 py-2 bg-red-600 hover:bg-red-700
                           text-white rounded-md text-xs sm:text-sm cursor-pointer"
                      >
                        {isCancelBooking === b.booking_id
                          ? "Đang hủy..."
                          : "Hủy"}
                      </button>
                    )}

                    {b.status === 2 && (
                      <div className="text-blue-500">Đã xem</div>
                    )}

                    {b.status === 3 && (
                      <div className="text-purple-500">Đang hoàn tiền</div>
                    )}

                    {b.status === 4 && (
                      <div className="text-red-500">Đã hủy</div>
                    )}
                  </div>
                </div>

                {/* --- Tickets Drawer --- */}
                {openId === b.booking_id && (
                  <div className="bg-[#111827] px-5 py-4 space-y-4 animate-fadeIn">
                    {b.tickets.map((t) => (
                      <div
                        key={t.ticket_id}
                        id={`ticket-${t.ticket_id}`}
                        className="border border-gray-700 rounded-lg p-4 bg-[#0f172a]
                        no-capture-selection"
                      >
                        <div className="flex flex-col sm:flex-row sm:justify-between">
                          <div>
                            <div className="text-gray-300 text-sm">
                              Mã vé:{" "}
                              <span className="text-blue-300 font-semibold">
                                {t.ticket_id}
                              </span>
                            </div>

                            <div className="mt-2 text-gray-300 text-sm">
                              Lịch chiếu:{" "}
                              <span className="text-white font-semibold">
                                {b.start_time} {b.showtime_date} {b.room}
                              </span>
                            </div>

                            <div className="mt-2 text-gray-300 text-sm">
                              Ghế:{" "}
                              <span className="text-white font-semibold">
                                {t.seat.seat_row}
                                {t.seat.seat_column}
                              </span>
                            </div>
                            <div className="mt-4 sm:mt-0">
                              <div className="text-gray-300 text-sm mb-1">
                                Danh sách đồ ăn, thức uống:
                              </div>

                              {t.foods.map((f, idx) => (
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

                          {t.status === 0 && (
                            <div
                              className="mt-4 sm:mt-0 flex justify-center flex-col
                          items-center"
                            >
                              <div className="text-gray-300 text-sm mb-1">
                                Mã QR:
                              </div>

                              <Image
                                src={t.qr_code}
                                alt="Mã QR"
                                height={100}
                                width={100}
                              />
                              <div>
                                <button
                                  className="px-2 py-1 bg-blue-400 rounded-sm mt-1
                                cursor-pointer"
                                  onClick={() =>
                                    downloadTicketImage(
                                      t.ticket_id,
                                      t.seat.seat_row + t.seat.seat_column
                                    )
                                  }
                                >
                                  Tải về
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
