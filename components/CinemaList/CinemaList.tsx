"use client";

import {
  checkBeforeDeleteCinemasAPI,
  getCinemasAPI,
  recoverCinemasAPI,
} from "@/lib/axios/cinemasAPI";
import {
  faBan,
  faCheck,
  faClock,
  faPen,
  faRefresh,
  faX,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Tippy from "@tippyjs/react";
import { useEffect, useState } from "react";
import styles from "./CinemaList.module.scss";
import FormAddEditCinema from "./FormAddEditCinema";
import { scrollToPosition, showToast, showToastForever } from "@/lib/function";
import Spinner from "../Spinner/Spinner";
import Swal from "sweetalert2";
import { deleteCinemaAPI } from "@/lib/axios/admin/cinemaAPI";

function CinemaList() {
  const [state, setState] = useState({
    isFetch: {
      cinemas: false,
    },
    cinemaList: [],
    refreshCinemaList: false,
    displayForm: false,
    cinemaIdEdit: -1,
    cinemaEdit: null,
  });

  useEffect(() => {
    const getCinemas = async () => {
      try {
        setState((prev) => ({
          ...prev,
          isFetch: { ...prev.isFetch, cinemas: true },
        }));
        const res = await getCinemasAPI();
        setState((prev) => ({ ...prev, cinemaList: res }));
      } catch (error) {
        console.log(error);
      } finally {
        setState((prev) => ({
          ...prev,
          isFetch: { ...prev.isFetch, cinemas: false },
        }));
      }
    };
    getCinemas();
  }, [state.refreshCinemaList]);

  const handleCallDeleteApi = async (cinema_id, type) => {
    try {
      showToastForever("info", "Đang xử lý...");
      const res = await deleteCinemaAPI(cinema_id, type);
      if (res.success) {
        showToast("success", res.message);
        setState((prev) => ({
          ...prev,
          refreshCinemaList: !prev.refreshCinemaList,
        }));
      }
    } catch (error) {
      console.log(error);
      showToast("error", "Có lỗi xảy ra, vui lòng thử lại");
    }
  };

  // kiểm tra -> gọi api
  const handleDelete = async (cinema_id) => {
    try {
      showToastForever("info", "Đang xử lý...");
      const res = await checkBeforeDeleteCinemasAPI(cinema_id);
      if (res.data.isDelete === "delete") {
        // TODO
        handleCallDeleteApi(cinema_id, 0);
      } else if (res.data.isDelete === "delete_showtime") {
        Swal.fire({
          icon: "warning",
          text: res.message,
          showCancelButton: true,
          confirmButtonText: "TIẾP TỤC",
          cancelButtonText: "DỪNG LẠI",
          customClass: {
            popup: "popup_alert",
            confirmButton: `btn_alert`,
            cancelButton: `btn_alert`,
          },
        }).then(async (result) => {
          if (result.isConfirmed) {
            handleCallDeleteApi(cinema_id, 1);
          }
        });
      } else if (res.data.isDelete === "delete_showtime_booking") {
        Swal.fire({
          icon: "warning",
          text: res.message,
          showCancelButton: true,
          confirmButtonText: "TIẾP TỤC",
          cancelButtonText: "DỪNG LẠI",
          customClass: {
            popup: "popup_alert",
            confirmButton: `btn_alert`,
            cancelButton: `btn_alert`,
          },
        }).then(async (result) => {
          if (result.isConfirmed) {
            handleCallDeleteApi(cinema_id, 2);
          }
        });
      }
    } catch (error) {
      console.log(error);
      showToast("error", error.message);
    }
  };

  // khôi phục
  const handleRecover = async (cinema_id) => {
    try {
      showToastForever("info", "Đang xử lý...");
      const res = await recoverCinemasAPI(cinema_id);
      if (res.success) {
        showToast("success", res.message);
        setState((prev) => ({
          ...prev,
          refreshCinemaList: !prev.refreshCinemaList,
        }));
      }
    } catch (error) {
      console.log(error);
      showToast("error", error.message);
    }
  };
  return (
    <div className="bg-white rounded-lg shadow relative">
      {/* thanh action */}
      <div className="flex justify-between p-2 items-center">
        {/* action right */}
        <div>
          {/* thêm khung giờ */}
          {state.displayForm && (
            <div className="flex items-center gap-3 bg-white p-4 rounded-lg shadow-sm border">
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded-md
                 hover:bg-blue-600 transition text-sm font-medium"
              >
                Thêm khung giờ <FontAwesomeIcon icon={faClock} />
              </button>
              <span className="text-gray-500 text-sm">Từ</span>
              <input
                type="time"
                className="px-3 py-2 border rounded-md text-sm
                 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <span className="text-gray-500 text-sm">–</span>
              <input
                type="time"
                className="px-3 py-2 border rounded-md text-sm
                 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          )}
        </div>

        <div>
          {(!state.displayForm ||
            (state.displayForm && state.cinemaEdit !== null)) && (
            <button
              className={`${styles.btn_add}`}
              onClick={() =>
                setState((prev) => ({
                  ...prev,
                  cinemaEdit: null,
                  cinemaIdEdit: -1,
                  displayForm: true,
                }))
              }
            >
              Thêm rạp
            </button>
          )}
        </div>
      </div>
      {/* form thêm/sửa */}
      {state.displayForm && (
        <FormAddEditCinema
          refreshCinemaList={() => {
            setState((prev) => ({
              ...prev,
              refreshCinemaList: !prev.refreshCinemaList,
            }));
          }}
          cinemaEdit={state.cinemaEdit}
          onClose={() => {
            setState((prev) => ({
              ...prev,
              displayForm: false,
              cinemaIdEdit: -1,
            }));
          }}
        />
      )}

      {/* danh sách rạp */}
      {state.isFetch.cinemas ? (
        <div className="py-6">
          <Spinner />
        </div>
      ) : (
        <div>
          <div
            className="grid grid-cols-[2fr_3fr_2fr_2fr_1fr_1fr_1fr] px-4 py-3 
                      bg-slate-100 text-slate-600 font-semibold text-sm
                      border-b"
          >
            <div>Tên rạp</div>
            <div>Địa chỉ chi tiết</div>
            <div>Quận/Huyện</div>
            <div>Tỉnh/Thành phố</div>
            <div>Trạng thái</div>
            <div className="text-right">Giá gốc</div>
            <div></div>
          </div>

          {state.cinemaList.map((c) => (
            <div
              key={c.cinema_id}
              className="grid grid-cols-[2fr_3fr_2fr_2fr_1fr_1fr_1fr] px-4 py-3
                     text-sm text-slate-700
                     border-b last:border-b-0
                     hover:bg-slate-50 transition"
            >
              <div className={`${styles.cinema_item} font-medium`}>
                {c.name}
              </div>
              <div className={`${styles.cinema_item}`}>
                {c.specific_address}
              </div>
              <div className={`${styles.cinema_item}`}>{c.ward}</div>
              <div className={`${styles.cinema_item}`}>{c.province}</div>
              <div
                className={`${styles.cinema_item} justify-center ${
                  c.status === 1 ? "text-green-400" : "text-red-400"
                }`}
              >
                <FontAwesomeIcon icon={c.status === 1 ? faCheck : faX} />
              </div>
              <div
                className={`${styles.cinema_item} justify-end font-semibold text-emerald-600`}
              >
                {Number(c.price_base).toLocaleString()} đ
              </div>
              <div className={`${styles.cinema_item} justify-end gap-2`}>
                <button
                  className={`${styles.action_btn} text-blue-400 ${
                    state.cinemaIdEdit === c.cinema_id
                      ? "pointer-events-none opacity-50"
                      : ""
                  }`}
                  onClick={() => {
                    setState((prev) => ({
                      ...prev,
                      cinemaIdEdit: c.cinema_id,
                      cinemaEdit: c,
                      displayForm: true,
                    }));
                    scrollToPosition(0);
                  }}
                >
                  <Tippy content="Sửa thông tin">
                    <FontAwesomeIcon icon={faPen} />
                  </Tippy>
                </button>
                <button
                  className={`${styles.action_btn} ${
                    c.status === 1 ? "text-red-400" : "text-green-400"
                  } `}
                  onClick={() => {
                    Swal.fire({
                      icon: "warning",
                      text:
                        c.status === 1
                          ? "Bạn chắc chắn muốn ngừng hoạt động rạp này?"
                          : "Bạn chắc chắn muốn rạp này hoạt động trở lại?",
                      showCancelButton: true,
                      confirmButtonText: "CHẮC CHẮN",
                      cancelButtonText: "KHÔNG",
                      customClass: {
                        popup: "popup_alert",
                        confirmButton: `btn_alert`,
                        cancelButton: `btn_alert`,
                      },
                    }).then(async (result) => {
                      if (result.isConfirmed) {
                        if (c.status === 1) {
                          handleDelete(c.cinema_id);
                        } else {
                          handleRecover(c.cinema_id);
                        }
                      }
                    });
                  }}
                >
                  <Tippy
                    content={
                      c.status === 1 ? "Ngừng hoạt động" : "Hoạt động lại"
                    }
                  >
                    <FontAwesomeIcon
                      icon={c.status === 1 ? faBan : faRefresh}
                    />
                  </Tippy>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default CinemaList;
