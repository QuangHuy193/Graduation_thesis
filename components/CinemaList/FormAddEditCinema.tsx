"use client";
import { useEffect, useState } from "react";
import styles from "./CinemaList.module.scss";
import { PROVINCES } from "@/lib/constant";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheck,
  faCircleXmark,
  faRefresh,
} from "@fortawesome/free-solid-svg-icons";
import { createCinemasAPI, updateCinemasAPI } from "@/lib/axios/cinemasAPI";
import { showToast } from "@/lib/function";
import { getScreenings } from "@/lib/axios/admin/movie_screenAPI";

function FormAddEditCinema({ cinemaEdit, onClose, refreshCinemaList }) {
  const [state, setState] = useState({
    isFetch: {
      addOrEdit: false,
    },
    movieScreening: [],
    cinemaNew: {
      cinema_id: -1,
      name: "",
      specific_address: "",
      ward: "",
      province: "",
      price_base: 0,
      time: [],
    },
  });

  //  lấy ds tất cả giờ chiếu
  useEffect(() => {
    const getMovieScreen = async () => {
      try {
        const res = await getScreenings();
        setState((prev) => ({ ...prev, movieScreening: res }));
      } catch (error) {
        console.log(error);
      }
    };
    getMovieScreen();
  }, []);

  useEffect(() => {
    if (cinemaEdit !== null) {
      setState((prev) => ({ ...prev, cinemaNew: { ...cinemaEdit } }));
    } else {
      setState((prev) => ({
        ...prev,
        cinemaNew: {
          cinema_id: -1,
          name: "",
          specific_address: "",
          ward: "",
          province: "",
          price_base: 0,
          time: [],
        },
      }));
    }
  }, [cinemaEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { name, specific_address, ward, province, price_base, time } =
      state.cinemaNew;
    if (
      name.trim() === "" ||
      specific_address.trim() === "" ||
      ward.trim() === "" ||
      province.trim() === ""
    ) {
      showToast("error", "Vui lòng nhập đủ thông tin tất cả các trường!");
      return;
    }

    if (Number(price_base) === 0) {
      showToast("error", "Giá gốc phải lớn hơn 0!");
      return;
    }

    if (time.length === 0) {
      showToast(
        "error",
        "Bạn chưa chọn bất kì khung giờ hoạt động nào cho rạp!"
      );
      return;
    }

    try {
      setState((prev) => ({
        ...prev,
        isFetch: { ...prev.isFetch, addOrEdit: true },
      }));
      // thêm
      let res;
      if (cinemaEdit === null) {
        res = await createCinemasAPI({ ...state.cinemaNew });
      }
      // cập nhật
      else {
        const timeOld = cinemaEdit.time.map((t) => t.movie_screen_id).sort();
        const timeNew = time.map((t) => t.movie_screen_id).sort();

        const isEqual = timeOld.every((id, index) => id === timeNew[index]);
        console.log(isEqual);
        if (
          name === cinemaEdit.name &&
          specific_address === cinemaEdit.specific_address &&
          ward === cinemaEdit.ward &&
          province === cinemaEdit.province &&
          Number(price_base) === Number(cinemaEdit.price_base) &&
          isEqual
        ) {
          showToast("info", "Bạn chưa thay đổi bất kì thông tin gì của rạp");
          return;
        }
        res = await updateCinemasAPI({ ...state.cinemaNew });
      }
      // thành công
      if (res.success) {
        showToast("success", res.message);
        refreshCinemaList();
        onClose();
      }
    } catch (error) {
      console.log(error);
      showToast("error", error.message || "Có lỗi xảy ra, vui lòng thử lại!");
    } finally {
      setState((prev) => ({
        ...prev,
        isFetch: { ...prev.isFetch, addOrEdit: false },
      }));
    }
  };

  // toggle time
  const handleToggleTime = (movie_screen_id) => {
    setState((prev) => {
      const index = prev.cinemaNew.time.findIndex(
        (t) => t.movie_screen_id === movie_screen_id
      );

      let newTime = [...prev.cinemaNew.time];

      if (index !== -1) {
        newTime.splice(index, 1);
      } else {
        newTime.push({ movie_screen_id });
      }

      return {
        ...prev,
        cinemaNew: {
          ...prev.cinemaNew,
          time: newTime,
        },
      };
    });
  };

  return (
    <div className="border border-gray-400 rounded-2xl my-4 p-2 relative">
      <div onClick={onClose}>
        <FontAwesomeIcon
          icon={faCircleXmark}
          className="absolute top-2 right-2 cursor-pointer text-red-500 p-1 text-xl"
        />
      </div>
      <h2 className="flex justify-center py-2 font-bold">
        {cinemaEdit === null ? "THÊM RẠP MỚI" : "CẬP NHẬT THÔNG TIN RẠP"}
      </h2>
      <form onSubmit={handleSubmit}>
        <div className={`${styles.form_input_group}`}>
          <label>Tên rạp</label>
          <input
            value={state.cinemaNew?.name}
            onChange={(e) => {
              setState((prev) => ({
                ...prev,
                cinemaNew: { ...prev.cinemaNew, name: e.target.value },
              }));
            }}
          />
        </div>
        <div className={`${styles.form_input_group}`}>
          <label>Địa chỉ chi tiết</label>
          <input
            value={state.cinemaNew?.specific_address}
            onChange={(e) => {
              setState((prev) => ({
                ...prev,
                cinemaNew: {
                  ...prev.cinemaNew,
                  specific_address: e.target.value,
                },
              }));
            }}
          />
        </div>
        <div className={`${styles.form_input_group}`}>
          <label>Quận/Huyện</label>
          <input
            value={state.cinemaNew?.ward}
            onChange={(e) => {
              setState((prev) => ({
                ...prev,
                cinemaNew: { ...prev.cinemaNew, ward: e.target.value },
              }));
            }}
          />
        </div>
        <div className={`${styles.form_input_group}`}>
          <label>Tỉnh/Thành phố</label>
          <select
            value={state.cinemaNew?.province}
            onChange={(e) => {
              setState((prev) => ({
                ...prev,
                cinemaNew: { ...prev.cinemaNew, province: e.target.value },
              }));
            }}
          >
            {PROVINCES.map((p, ind) => (
              <option key={ind} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
        <div className={`${styles.form_input_group}`}>
          <label>Giá gốc</label>
          <input
            inputMode="numeric"
            value={state.cinemaNew?.price_base}
            onChange={(e) => {
              // chỉ cho nhập số
              const value = e.target.value;
              if (!/^\d*$/.test(value)) return;

              setState((prev) => ({
                ...prev,
                cinemaNew: {
                  ...prev.cinemaNew,
                  price_base: value === "" ? 0 : value,
                },
              }));
            }}
          />
        </div>
        <div className={`${styles.form_input_group}`}>
          <label>Khung giờ hoạt động</label>
          {state.movieScreening.map((t, ind) => {
            let isSelected = false;
            if (state.cinemaNew.time.length !== 0) {
              isSelected = state.cinemaNew.time.some(
                (item) => item.movie_screen_id === t.movie_screen_id
              );
            }

            return (
              <div
                key={ind}
                className="flex items-center gap-2 cursor-pointer"
                onClick={() => handleToggleTime(t.movie_screen_id)}
              >
                <div
                  className="w-5 h-5 border border-blue-400 rounded-sm flex 
                items-center justify-center"
                >
                  {isSelected && (
                    <FontAwesomeIcon
                      icon={faCheck}
                      className="text-green-500"
                    />
                  )}
                </div>
                <span>
                  {t.start_time}-{t.end_time}
                </span>
              </div>
            );
          })}
        </div>
        <div className="flex justify-end gap-2 my-2">
          <div>
            <button
              onClick={() => {
                if (cinemaEdit !== null) {
                  setState((prev) => ({
                    ...prev,
                    cinemaNew: { ...cinemaEdit },
                  }));
                } else {
                  setState((prev) => ({
                    ...prev,
                    cinemaNew: {
                      cinema_id: -1,
                      name: "",
                      specific_address: "",
                      ward: "",
                      province: "",
                      price_base: 0,
                      time: [],
                    },
                  }));
                }
              }}
              type="button"
              className={`${styles.btn_add} flex gap-2 items-center text-slate-600
              bg-slate-600! hover:bg-slate-300! hover:text-slate-800!`}
            >
              <FontAwesomeIcon icon={faRefresh} />
              <span>Hoàn tác</span>
            </button>
          </div>
          <div>
            <button type="submit" className={`${styles.btn_add}`}>
              {state.isFetch.addOrEdit
                ? "Đang xử lý..."
                : cinemaEdit !== null
                ? "Cập nhật rạp"
                : "Tạo mới rạp"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default FormAddEditCinema;
