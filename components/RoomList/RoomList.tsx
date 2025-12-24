"use client";

import { getCinemasWithCityAPI } from "@/lib/axios/cinemasAPI";
import {
  checkBeforeDeleteRoomAPI,
  deleteRoomAPI,
  getAllRoomInCinemaAPI,
  recoverRoomAPI,
} from "@/lib/axios/roomAPI";
import { useEffect, useState } from "react";
import Spinner from "../Spinner/Spinner";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCirclePause,
  faCirclePlay,
  faEllipsisVertical,
  faMap,
  faPlus,
} from "@fortawesome/free-solid-svg-icons";
import Tippy from "@tippyjs/react";
import Swal from "sweetalert2";
import { showToast } from "@/lib/function";

function RoomList({
  // bật tắt thêm/sửa phòng
  setToggleRoom,
  // để cập nhật
  setRoom,
  // lưu cinemaid cho diagram
  setCinemaId,
  // chuyển tab
  setActiviTab,
}: {
  setToggleRoom: (path: string) => void;
}) {
  const [state, setState] = useState({
    isFetch: {
      cinema: false,
      status: -1,
      room: false,
    },
    reload: false,
    // mở popup
    openPopup: -1,
    // ds cinema
    cinemaList: [],
    // ds room
    roomList: [],
    // các giá trị chọn
    selected: {
      cinema: -1,
    },
  });

  useEffect(() => {
    const getCinemas = async () => {
      try {
        setState((prev) => ({
          ...prev,
          isFetch: {
            ...prev.isFetch,
            cinema: true,
          },
        }));
        const res = await getCinemasWithCityAPI();
        setState((prev) => ({ ...prev, cinemaList: res }));
        setState((prev) => ({
          ...prev,
          selected: { ...prev.selected, cinema: res[0].cinema_id },
        }));
      } catch (error) {
        console.log(error);
      } finally {
        setState((prev) => ({
          ...prev,
          isFetch: {
            ...prev.isFetch,
            cinema: false,
          },
        }));
      }
    };
    getCinemas();
  }, []);

  useEffect(() => {
    if (state.selected.cinema === -1) return;

    setCinemaId(state.selected.cinema);

    const getRoomsIncinema = async (cinema_id) => {
      console.log("errrr");
      try {
        setState((prev) => ({
          ...prev,
          isFetch: {
            ...prev.isFetch,
            room: true,
          },
        }));
        const res = await getAllRoomInCinemaAPI(cinema_id);
        setState((prev) => ({ ...prev, roomList: res }));
      } catch (error) {
        console.log(error);
      } finally {
        setState((prev) => ({
          ...prev,
          isFetch: {
            ...prev.isFetch,
            room: false,
          },
        }));
      }
    };

    getRoomsIncinema(state.selected.cinema);
  }, [state.selected.cinema, state.reload]);

  // gọi api xóa (tách do có xác nhận nhiều lần)
  const callApiDeleteRoom = async (room_id, type) => {
    setState((prev) => ({
      ...prev,
      isFetch: { ...prev.isFetch, status: room_id },
    }));

    try {
      const res = await deleteRoomAPI(room_id, type);

      if (res.success) {
        showToast("success", "Phòng đã ngừng hoạt động");
        setState((prev) => ({
          ...prev,
          reload: !prev.reload,
        }));
      }
    } catch (error) {
      showToast("error", error?.message || "Có lỗi xảy ra, vui lòng thử lại!");
      console.log(error);
    } finally {
      setState((prev) => ({
        ...prev,
        isFetch: { ...prev.isFetch, status: -1 },
        reload: !prev.reload,
      }));
    }
  };

  // xóa phòng
  const handleDeleteRoom = async (room_id) => {
    setState((prev) => ({ ...prev, openPopup: -1 }));

    const confirm = await Swal.fire({
      icon: "warning",
      text: "Bạn chắc chắn muốn chuyển phòng này sang trạng thái tạm dừng hoạt động?",
      showCancelButton: true,
      confirmButtonText: "CHẮC CHẮN",
      cancelButtonText: "HỦY",
      customClass: {
        popup: "popup_alert",
        confirmButton: "btn_alert",
        cancelButton: "btn_alert",
      },
    });

    if (!confirm.isConfirmed) return;

    try {
      const check = await checkBeforeDeleteRoomAPI(room_id);

      // có thể ngừng ngay
      if (check.data.case === "delete") {
        await callApiDeleteRoom(room_id, 0);
        return;
      }
      // có lịch chiếu
      else {
        // có phòng có booking
        if (check.data.case === "change_room_booking") {
          const confirm = await Swal.fire({
            icon: "warning",
            text: check.message,
            showCancelButton: true,
            confirmButtonText: "ĐẾN TRANG QUẢN TRỊ",
            cancelButtonText: "TIẾP TỤC XÓA",
            customClass: {
              popup: "popup_alert",
              confirmButton: "btn_alert",
              cancelButton: "btn_alert",
            },
          });

          if (confirm.isConfirmed) {
            // chuyển trang
            setActiviTab("showtimes");
          } else {
            // xóa, hủy suất, hoàn tiền
            await callApiDeleteRoom(room_id, 2);
          }
        }
        // có phòng không có booking
        if (check.data.case === "change_room") {
          const confirm = await Swal.fire({
            icon: "warning",
            text: check.message,
            showCancelButton: true,
            confirmButtonText: "ĐẾN TRANG QUẢN TRỊ",
            cancelButtonText: "TIẾP TỤC XÓA",
            customClass: {
              popup: "popup_alert",
              confirmButton: "btn_alert",
              cancelButton: "btn_alert",
            },
          });

          if (confirm.isConfirmed) {
            // chuyển trang
            setActiviTab("showtimes");
          } else {
            // xóa, hủy suất
            await callApiDeleteRoom(room_id, 1);
          }
        }
        // không có phòng không có booking
        if (check.data.case === "cancel_showtime") {
          const confirm = await Swal.fire({
            icon: "warning",
            text: check.message,
            showCancelButton: true,
            confirmButtonText: "XÁC NHẬN",
            cancelButtonText: "HỦY",
            customClass: {
              popup: "popup_alert",
              confirmButton: "btn_alert",
              cancelButton: "btn_alert",
            },
          });

          if (confirm.isConfirmed) {
            // xóa, hủy suất
            await callApiDeleteRoom(room_id, 1);
          }
        }
        // không có phòng có booking
        if (check.data.case === "refund") {
          const confirm = await Swal.fire({
            icon: "warning",
            text: check.message,
            showCancelButton: true,
            confirmButtonText: "XÁC NHẬN",
            cancelButtonText: "HỦY",
            customClass: {
              popup: "popup_alert",
              confirmButton: "btn_alert",
              cancelButton: "btn_alert",
            },
          });

          if (confirm.isConfirmed) {
            // xóa, hủy suất, hoàn tiền
            await callApiDeleteRoom(room_id, 2);
          }
        }
      }
    } catch (error) {
      showToast("error", "Có lỗi xảy ra, vui lòng thử lại!");
      console.log(error);
    }
  };

  return (
    <div className="bg-white rounded shadow">
      <div className="py-2 flex justify-between px-3">
        <div>
          <label className="px-2">Rạp:</label>
          <select
            className="border rounded py-2 text-sm focus:outline-0 hover:cursor-pointer"
            value={state.selected.cinema}
            onChange={(e) =>
              setState((prev) => ({
                ...prev,
                selected: {
                  ...prev.selected,
                  cinema: e.target.value,
                },
              }))
            }
          >
            {state.cinemaList.map((c) => (
              <option key={c.cinema_id} value={c.cinema_id}>
                {c.name + " (" + c.province + ")"}
              </option>
            ))}
          </select>
        </div>
        <div>
          <button
            className="px-2 py-1 border border-gray-400 rounded-lg cursor-pointer
            flex gap-1 items-center"
            onClick={() => {
              setToggleRoom("aside");
              setRoom({});
            }}
          >
            <FontAwesomeIcon icon={faPlus} />
            Thêm phòng
          </button>
        </div>
      </div>

      {state.roomList.length === 0 ? (
        state.isFetch.room ? (
          <div className="py-7">
            <Spinner />
          </div>
        ) : (
          <div className="flex justify-center italic py-7">
            Rạp hiện chưa có phòng nào
          </div>
        )
      ) : (
        <div className="py-2 px-3">
          <div
            className="grid grid-cols-5 border-b border-b-gray-400 gap-2 font-bold 
          py-2"
          >
            <div>Tên</div>
            <div className="flex justify-center">Chiều dài (ghế)</div>
            <div className="flex justify-center">Chiều rộng (ghế)</div>
            <div className="flex justify-center">Số ghế tối đa</div>
            <div className="flex justify-center">Trạng thái</div>
          </div>
          {state.roomList.map((r, index) => (
            <div
              key={r.room_id}
              className={`w-full grid grid-cols-5 py-3 ${
                index !== state.roomList.length - 1 &&
                "border-b border-b-gray-400"
              } relative `}
            >
              <div>{r.name}</div>
              <div className="flex justify-center">{r.width}</div>
              <div className="flex justify-center">{r.height}</div>
              <div className="flex justify-center">{r.capacity}</div>
              <div
                className={`flex justify-center ${
                  r.status === 1 ? "text-green-400" : "text-red-500"
                }`}
              >
                {state.isFetch.status === r.room_id
                  ? "Đang chuyển trạng thái..."
                  : r.status === 1
                  ? "Hoạt động"
                  : "Không hoạt động"}
              </div>

              <Tippy
                onClickOutside={() => {
                  setState((prev) => ({
                    ...prev,
                    openPopup: -1,
                  }));
                }}
                visible={state.openPopup === r.room_id ? true : false}
                interactive
                theme="room"
                content={
                  <div
                    className="min-w-[200px] rounded-xl bg-white border
                   border-gray-100 py-1 text-sm"
                  >
                    {/* Xem sơ đồ */}
                    <div
                      className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 
                      cursor-pointer transition"
                    >
                      <FontAwesomeIcon icon={faMap} className="text-gray-500" />
                      <span
                        className="text-gray-700"
                        onClick={() => {
                          setToggleRoom("aside");
                          setRoom(r);
                          setState((prev) => ({
                            ...prev,
                            openPopup: -1,
                          }));
                        }}
                      >
                        Xem sơ đồ phòng
                      </span>
                    </div>

                    <div className="h-px bg-gray-200 my-1" />

                    {/* Trạng thái */}
                    {r.status === 1 ? (
                      <div
                        className="flex items-center gap-3 px-4 py-2 hover:bg-red-50 
                        cursor-pointer transition text-red-600"
                      >
                        <FontAwesomeIcon
                          icon={faCirclePause}
                          className="text-red-500"
                        />
                        <span onClick={() => handleDeleteRoom(r.room_id)}>
                          Tạm dừng hoạt động
                        </span>
                      </div>
                    ) : (
                      <div
                        className="flex items-center gap-3 px-4 py-2 hover:bg-green-50 
                        cursor-pointer transition text-green-600"
                      >
                        <FontAwesomeIcon
                          icon={faCirclePlay}
                          className="text-green-500"
                        />
                        <span
                          onClick={() => {
                            Swal.fire({
                              icon: "warning",
                              text: `Bạn chắc chắn muốn chuyển phòng này 
                              sang trạng thái hoạt động?`,
                              showCancelButton: true,
                              confirmButtonText: "CHẮC CHẮN",
                              cancelButtonText: "HỦY",
                              customClass: {
                                popup: "popup_alert",
                                confirmButton: `btn_alert`,
                                cancelButton: `btn_alert`,
                              },
                            }).then(async (result) => {
                              if (result.isConfirmed) {
                                try {
                                  setState((prev) => ({
                                    ...prev,
                                    isFetch: {
                                      ...prev.isFetch,
                                      status: r.room_id,
                                    },
                                  }));
                                  const res = await recoverRoomAPI(r.room_id);
                                  if (res.success) {
                                    Swal.fire({
                                      toast: true,
                                      position: "top-end",
                                      icon: "success",
                                      title: "Chuyển trạng thái thành công",
                                      showConfirmButton: false,
                                      timer: 2000,
                                      timerProgressBar: true,
                                    });
                                  }
                                } catch (error) {
                                  Swal.fire({
                                    toast: true,
                                    position: "top-end",
                                    icon: "error",
                                    title: error?.message
                                      ? error.message
                                      : "Có lỗi xảy ra, vui lòng thử lại!",
                                    showConfirmButton: false,
                                    timer: 2000,
                                    timerProgressBar: true,
                                  });
                                  console.log(error);
                                } finally {
                                  setState((prev) => ({
                                    ...prev,
                                    isFetch: { ...prev.isFetch, status: -1 },
                                    reload: !prev.reload,
                                  }));
                                }
                              }
                            });
                            setState((prev) => ({
                              ...prev,
                              openPopup: -1,
                            }));
                          }}
                        >
                          Hoạt động trở lại
                        </span>
                      </div>
                    )}
                  </div>
                }
              >
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center">
                  <FontAwesomeIcon
                    icon={faEllipsisVertical}
                    className="cursor-pointer"
                    onClick={() =>
                      setState((prev) => ({
                        ...prev,
                        openPopup:
                          prev.openPopup === r.room_id ? -1 : r.room_id,
                      }))
                    }
                  />
                </div>
              </Tippy>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default RoomList;
