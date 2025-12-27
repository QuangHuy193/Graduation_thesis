"use client";

import { getCinemasAPI } from "@/lib/axios/cinemasAPI";
import { faBan, faCheck, faPen, faX } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Tippy from "@tippyjs/react";
import { useEffect, useState } from "react";
import styles from "./CinemaList.module.scss";
import FormAddEditCinema from "./FormAddEditCinema";
import { scrollToPosition } from "@/lib/function";
import Spinner from "../Spinner/Spinner";

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
  return (
    <div className="bg-white rounded-lg shadow">
      {/* thanh action */}
      <div className="flex justify-between p-2 items-center">
        <div>Lọc,...</div>
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
          cinemaEdit={state.cinemaEdit}
          onClose={() => {
            setState((prev) => ({ ...prev, displayForm: false }));
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
                  className={`${styles.action_btn} text-blue-400`}
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
                >
                  <Tippy
                    content={
                      c.status === 1 ? "Ngừng hoạt động" : "Hoạt động lại"
                    }
                  >
                    <FontAwesomeIcon icon={c.status === 1 ? faBan : faCheck} />
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
