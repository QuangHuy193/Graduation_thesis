import { useState } from "react";
import styles from "./CinemaList.module.scss";
import { PROVINCES } from "@/lib/constant";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleXmark } from "@fortawesome/free-solid-svg-icons";

function FormAddEditCinema({ cinemaEdit, onClose }) {
  const [state, setState] = useState({
    cinemaNew: {
      ...cinemaEdit,
    },
  });

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
      <form>
        <div className={`${styles.form_input_group}`}>
          <label>Tên rạp</label>
          <input
            value={state.cinemaNew?.name ? state.cinemaNew.name : ""}
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
            value={
              state.cinemaNew?.specific_address
                ? state.cinemaNew.specific_address
                : ""
            }
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
            value={state.cinemaNew?.ward ? state.cinemaNew.ward : ""}
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
            value={state.cinemaNew?.province ? state.cinemaNew.province : ""}
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
            value={
              state.cinemaNew?.price_base ? state.cinemaNew.price_base : ""
            }
            onChange={(e) => {
              setState((prev) => ({
                ...prev,
                cinemaNew: { ...prev.cinemaNew, price_base: e.target.value },
              }));
            }}
          />
        </div>
        <div className="text-end">
          <button className={`${styles.btn_add}`}>
            {cinemaEdit !== null ? "Cập nhật rạp" : "Tạo mới rạp"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default FormAddEditCinema;
