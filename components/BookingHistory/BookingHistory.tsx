"use client";

import { cancelBookingAPI } from "@/lib/axios/bookingAPI";
import { getRefundPercent } from "@/lib/function";
import { faChevronDown } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { useState } from "react";
import Swal from "sweetalert2";

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
  console.log(user);

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

  const handleCancelBooking = async (
    booking_id: number | string,
    date: Date,
    time: string
  ) => {
    Swal.fire({
      icon: "warning",
      text: `Bạn có chắc muốn hủy đơn hàng? 
      Việc hủy có thể làm bạn mất một phần giá trị vé theo quy định hoàn tiền, 
      và thao tác này sẽ không thể hoàn tác.`,
      confirmButtonText: "ĐỒNG Ý",
      cancelButtonText: "HỦY",
      showCancelButton: true,
      customClass: {
        popup: "popup_alert",
        confirmButton: `btn_alert`,
        cancelButton: `btn_alert`,
      },
    }).then(async (result) => {
      if (result.isConfirmed) {
        // TODO thêm vip của user
        const refundPercent = getRefundPercent(date, time, 0);

        if (refundPercent === 0) {
          Swal.fire({
            icon: "error",
            text: "Suất chiếu còn dưới 3 giờ nên không thể hủy vé!",
          });
          return;
        }

        // gọi api
        try {
          setIsCancelBooking(booking_id);

          const res = await cancelBookingAPI(booking_id, refundPercent);

          console.log(res);

          Swal.fire({
            toast: true,
            position: "top-end",
            icon: res.success ? "success" : "error",
            text: res.success ? "Đã hủy đơn hàng" : "Hủy đơn hàng thất bại",
            showConfirmButton: false,
            timer: 2000,
          });
        } catch (error) {
          Swal.fire({
            toast: true,
            position: "top-end",
            icon: "error",
            text: "Hủy đơn hàng thất bại",
            showConfirmButton: false,
            timer: 2000,
          });
          console.log(error);
        } finally {
          setIsCancelBooking(-1);
        }
      }
    });
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
                             duration-300 ${
                               openId === b.booking_id
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
                                height={80}
                                width={80}
                              />
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
