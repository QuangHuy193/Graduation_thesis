"use client";
import {
  createScreeningsAPI,
  deleteScreeningsAPI,
  getScreenings,
  updateScreeningsAPI,
} from "@/lib/axios/admin/movie_screenAPI";
import { useEffect, useState, useMemo } from "react";
import styles from "./CinemaList.module.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faCircleXmark,
  faEdit,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { showToast, showToastForever } from "@/lib/function";
import Swal from "sweetalert2";

/* ===== helper ===== */
const calcDuration = (start, end) => {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  return eh * 60 + em - (sh * 60 + sm);
};

const getPeriod = (time) => {
  const hour = parseInt(time.split(":")[0]);
  if (hour < 12) return "Buổi sáng";
  if (hour < 18) return "Buổi chiều";
  return "Buổi tối";
};

const getPeriodIndex = (time) => {
  const hour = parseInt(time.split(":")[0], 10);
  if (hour < 12) return 0; // sáng
  if (hour < 18) return 1; // chiều
  return 2; // tối
};

function MovieScreening({ setActiviTab }) {
  const [state, setState] = useState({
    movieScreening: [],
    refreshMovieScreening: false,
    filter: -1,
    dispalyForm: false,
    editing: -1,
    form: {
      start_time: "",
      end_time: "",
    },
  });

  // lấy danh sach khung giờ chiếu
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getScreenings();
        setState((prev) => ({ ...prev, movieScreening: res }));
      } catch (error) {
        console.log(error);
      }
    };
    fetchData();
  }, [state.refreshMovieScreening]);

  // lọc
  const filteredMovieScreening = useMemo(() => {
    if (state.filter === -1) return state.movieScreening;

    return state.movieScreening.filter(
      (item) => getPeriodIndex(item.start_time) === state.filter
    );
  }, [state.movieScreening, state.filter]);

  // nhóm theo buổi
  const grouped = useMemo(() => {
    const result = {
      "Buổi sáng": [],
      "Buổi chiều": [],
      "Buổi tối": [],
    };

    filteredMovieScreening.forEach((item) => {
      const period = getPeriod(item.start_time);
      result[period].push(item);
    });

    return result;
  }, [filteredMovieScreening]);

  const handleAdd = async () => {
    try {
      showToastForever("info", "Đang xử lý...");
      const res = await createScreeningsAPI({ ...state.form });
      if (res.success) {
        showToast("success", res.message);
        setState((prev) => ({
          ...prev,
          refreshMovieScreening: !prev.refreshMovieScreening,
          form: {
            start_time: "",
            end_time: "",
          },
          displayForm: false,
        }));
      }
    } catch (error) {
      console.log(error);
      showToast("error", "Có lỗi xảy ra, vui lòng thử lại!");
    }
  };

  const handleEdit = async () => {
    try {
      showToastForever("info", "Đang xử lý...");
      const res = await updateScreeningsAPI({
        ...state.form,
        movie_screen_id: state.editing,
      });
      if (res.success) {
        showToast("success", res.message);
        setState((prev) => ({
          ...prev,
          refreshMovieScreening: !prev.refreshMovieScreening,
          form: {
            start_time: "",
            end_time: "",
          },
          displayForm: false,
        }));
      }
    } catch (error) {
      console.log(error);
      showToast("error", "Có lỗi xảy ra, vui lòng thử lại!");
    }
  };

  const handleDelete = async (movie_screen_id) => {
    try {
      showToastForever("info", "Đang xử lý...");
      const res = await deleteScreeningsAPI(movie_screen_id);
      console.log(res);
      if (res.data.delete) {
        showToast("success", res.message);
        setState((prev) => ({
          ...prev,
          refreshMovieScreening: !prev.refreshMovieScreening,
          form: {
            start_time: "",
            end_time: "",
          },
          displayForm: false,
        }));
      } else {
        Swal.fire({
          icon: "warning",
          text: res.message,
          showCancelButton: true,
          confirmButtonText: "ĐẾN TRANG QUẢN LÝ SUẤT CHIẾU",
          cancelButtonText: "ĐÃ HIỂU",
          customClass: {
            popup: "popup_alert",
            confirmButton: `btn_alert`,
            cancelButton: `btn_alert`,
          },
        }).then(async (result) => {
          if (result.isConfirmed) {
            setActiviTab("showtimes");
          }
        });
      }
    } catch (error) {
      console.log(error);
      showToast("error", "Có lỗi xảy ra, vui lòng thử lại!");
    }
  };

  const handleSubmit = async () => {
    if (state.form.start_time === "" || state.form.end_time === "") {
      showToast("error", "Bạn chưa điền đủ thông tin!");
      return;
    }

    if (state.editing === -1) {
      handleAdd();
    } else {
      handleEdit();
    }
  };

  return (
    <div>
      {/* ===== action bar ===== */}
      <div className={`${styles.actions} flex-col`}>
        {/* action trên */}
        <div>
          <button
            className={styles.btnBack}
            onClick={() => setActiviTab("cinemas")}
          >
            <FontAwesomeIcon icon={faArrowLeft} />
            Quay lại
          </button>
        </div>
        {/* action dưới */}
        <div className="flex items-center justify-between mt-6">
          {/* filter */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-600 font-medium">
              Lọc theo buổi
            </span>

            <select
              className=" px-3 py-2 border border-slate-300 rounded-md text-sm
              text-slate-700 bg-white focus:outline-none focus:ring-2
               focus:ring-blue-400"
              onChange={(e) =>
                setState((prev) => ({
                  ...prev,
                  filter: Number(e.target.value),
                }))
              }
            >
              <option value={-1}>Tất cả</option>
              <option value={0}>Buổi sáng</option>
              <option value={1}>Buổi chiều</option>
              <option value={2}>Buổi tối</option>
            </select>
          </div>

          {/* add */}
          <button
            className=" px-4 py-2 bg-blue-500 text-whi rounded-md text-sm 
            font-medium hover:bg-blue-600 transition shadow-sm text-white"
            onClick={() => setState((prev) => ({ ...prev, displayForm: true }))}
          >
            + Thêm khung giờ
          </button>
        </div>
      </div>

      {state.displayForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-[380px] p-5 shadow-lg relative">
            <h3 className="text-base font-semibold text-slate-700 mb-4 mt-2">
              {state.editing !== -1 ? "Sửa khung giờ" : "Thêm khung giờ"}
            </h3>
            <div
              className="absolute top-1 right-1 p-1"
              onClick={() =>
                setState((prev) => ({
                  ...prev,
                  editing: -1,
                  displayForm: false,
                }))
              }
            >
              <FontAwesomeIcon
                icon={faCircleXmark}
                className="cursor-pointer text-red-500 hover:text-red-600"
              />
            </div>

            <div className="space-y-4">
              <p className="text-xs text-slate-500 mt-1">
                Ghi chú: SA từ 00:00 → 11:59, CH từ 12:00 → 23:59
              </p>

              {/* start time */}
              <div>
                <label className="block text-sm text-slate-600 mb-1">
                  Giờ bắt đầu
                </label>
                <input
                  type="time"
                  value={state.form.start_time}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (state.form.end_time) {
                      if (calcDuration(value, state.form.end_time) <= 0) {
                        showToast(
                          "error",
                          "Thời gian bắt đầu phải trước thời gian kết thúc!"
                        );
                        return;
                      }
                    }
                    setState((prev) => ({
                      ...prev,
                      form: { ...prev.form, start_time: value },
                    }));
                  }}
                  className="w-full border rounded-md px-3 py-2 text-sm"
                />
                {state.form.start_time && (
                  <p className="text-xs text-slate-500 mt-1">
                    Giờ hệ thống lưu: {state.form.start_time}{" "}
                  </p>
                )}
              </div>

              {/* end time */}
              <div>
                <label className="block text-sm text-slate-600 mb-1">
                  Giờ kết thúc
                </label>
                <input
                  type="time"
                  value={state.form.end_time}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (state.form.start_time) {
                      if (calcDuration(state.form.start_time, value) <= 0) {
                        showToast(
                          "error",
                          "Thời gian kết thúc phải sau thời gian bắt đầu"
                        );
                        return;
                      }
                    }
                    setState((prev) => ({
                      ...prev,
                      form: { ...prev.form, end_time: value },
                    }));
                  }}
                  className="w-full border rounded-md px-3 py-2 text-sm"
                />
                {state.form.end_time && (
                  <p className="text-xs text-slate-500 mt-1">
                    Giờ hệ thống lưu: {state.form.end_time}{" "}
                  </p>
                )}
              </div>
              {state.form.start_time && state.form.end_time && (
                <div className="text-sm text-slate-500 mt-1">
                  Thời lượng khung giờ chiếu{" "}
                  {calcDuration(state.form.start_time, state.form.end_time)}{" "}
                  phút
                </div>
              )}
            </div>

            {/* actions */}
            <div className="flex justify-end gap-3 mt-6">
              <button
                className="px-4 py-2 text-sm text-slate-600 hover:underline cursor-pointer
                hover:text-red-500"
                onClick={() =>
                  setState((prev) => ({
                    ...prev,
                    form: { start_time: "", end_time: "" },
                  }))
                }
              >
                Xóa
              </button>

              <button
                className="px-4 py-2 bg-blue-500 text-white rounded-md text-sm
                 hover:bg-blue-600 cursor-pointer"
                onClick={handleSubmit}
              >
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== content ===== */}
      <div className="bg-white rounded-lg shadow mt-4">
        <div className="px-4 py-3 border-b font-semibold text-slate-700">
          Quản lý khung giờ chiếu
        </div>

        {state.movieScreening.length === 0 ? (
          <div className="p-6 text-sm text-slate-500 italic">
            Chưa có khung giờ chiếu
          </div>
        ) : (
          <div className="p-4 space-y-6">
            {Object.entries(grouped).map(([period, list]) =>
              list.length === 0 ? null : (
                <div key={period}>
                  {/* title */}
                  <div className="mb-3 text-sm font-semibold text-slate-600 uppercase">
                    {period}
                  </div>

                  {/* grid time block */}
                  <div className="grid grid-cols-2 gap-4">
                    {list.map((item) => {
                      const duration = calcDuration(
                        item.start_time,
                        item.end_time
                      );

                      return (
                        <div
                          key={item.movie_screen_id}
                          className="
                            group relative
                            border rounded-lg p-4
                            bg-white
                            hover:border-blue-400
                            transition
                          "
                        >
                          {/* time */}
                          <div className="flex items-center gap-3">
                            <div className="text-lg font-semibold text-slate-800">
                              {item.start_time.slice(0, 5)}
                              <span className="mx-2 text-slate-400">→</span>
                              {item.end_time.slice(0, 5)}
                            </div>

                            <span className="text-xs px-2 py-1 rounded bg-blue-50 text-blue-600">
                              {duration} phút
                            </span>
                          </div>

                          {/* actions */}
                          <div
                            className="
                              absolute top-3 right-3
                              opacity-0 group-hover:opacity-100
                              transition
                              flex gap-3
                              text-sm
                            "
                          >
                            <button
                              className="text-blue-500 hover:underline cursor-pointer"
                              onClick={() => {
                                setState((prev) => ({
                                  ...prev,
                                  displayForm: true,
                                  editing: item.movie_screen_id,
                                  form: {
                                    start_time: item.start_time,
                                    end_time: item.end_time,
                                  },
                                }));
                              }}
                            >
                              <FontAwesomeIcon icon={faEdit} /> Sửa
                            </button>
                            <button
                              className="text-red-400 hover:underline cursor-pointer"
                              onClick={() =>
                                Swal.fire({
                                  icon: "warning",
                                  text: "Thao tác này không thể hoàn tác!, Bạn vẫn muốn tiếp tục xóa giờ chiếu này?",
                                  showCancelButton: true,
                                  confirmButtonText: "TIẾP TỤC",
                                  cancelButtonText: "HỦY",
                                  customClass: {
                                    popup: "popup_alert",
                                    confirmButton: `btn_alert`,
                                    cancelButton: `btn_alert`,
                                  },
                                }).then(async (result) => {
                                  if (result.isConfirmed) {
                                    handleDelete(item.movie_screen_id);
                                  }
                                })
                              }
                            >
                              <FontAwesomeIcon icon={faTrash} /> Xóa
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default MovieScreening;
