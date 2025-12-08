"use client";

import { CANCELBOOKING } from "@/lib/constant";
import {
  faChevronCircleDown,
  faChevronDown,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Image from "next/image";
import { useState } from "react";
import Swal from "sweetalert2";

export default function BookingHistory({ bookings = [] }) {
  const [openId, setOpenId] = useState(-1);

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
                  {b.status === 1 && (
                    <div className="flex justify-between">
                      {/* Mũi tên gợi ý mở/đóng */}
                      <div className="pl-5">
                        <FontAwesomeIcon
                          icon={faChevronDown}
                          className={`w-4 h-4 text-yellow-300 transition-transform
                             duration-300 ${
                               openId === b.booking_id
                                 ? "rotate-180"
                                 : "rotate-0"
                             }`}
                        />
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation(); // không toggle mở/đóng drawer
                        }}
                        className="h-fit px-3 py-2 bg-red-600 hover:bg-red-700
                           text-white rounded-md text-xs sm:text-sm cursor-pointer"
                      >
                        Hủy vé
                      </button>
                    </div>
                  )}
                </div>

                {/* --- Tickets Drawer --- */}
                {openId === b.booking_id && (
                  <div className="bg-[#111827] px-5 py-4 space-y-4 animate-fadeIn">
                    {b.tickets.map((t) => (
                      <div
                        key={t.ticket_id}
                        className="border border-gray-700 rounded-lg p-4 bg-[#0f172a]"
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
                              height={80}
                              width={80}
                            />
                          </div>
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
