"use client";
import {
  faCalendar,
  faFilm,
  faLocationDot,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import styles from "./ShowtimePageSelectBar.module.scss";
import { Select } from "antd";
import { useEffect, useState } from "react";
import { LIMITDAY, weekdays } from "@/lib/constant";
import { getMovieListAPI } from "@/lib/axios/movieAPI";
import { getCinemasWithCityAPI } from "@/lib/axios/cinemasAPI";

function ShowtimePageSelectBar({ valueSelected, setValueSelected }) {
  const [state, setState] = useState({
    isFetch: false,
    dateList: [],
    movieList: [],
    cinemaList: [],
  });

  useEffect(() => {
    const createDateList = () => {
      let list = [];
      const today = new Date();

      for (let i = 0; i < LIMITDAY; i++) {
        const d = new Date();
        d.setDate(today.getDate() + i);

        const day = d.getDay(); // 0 - 6
        const dd = String(d.getDate()).padStart(2, "0");
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const yyyy = d.getFullYear();

        const value = `${yyyy}-${mm}-${dd}`;

        // Format hiển thị
        const weekdayName = i === 0 ? "Hôm nay" : weekdays[day];
        const dateDisplay = `${weekdayName}, ${dd}/${mm}`;

        list.push({
          value,
          dateDisplay,
        });
      }
      setState((prev) => ({ ...prev, dateList: list }));
      setValueSelected("date", list[0].value);
    };

    const getMovieList = async () => {
      setState((prev) => ({ ...prev, isFetch: true }));
      try {
        const res = await getMovieListAPI();
        setState((prev) => ({ ...prev, movieList: res }));
      } catch (error) {
        console.log(error);
      }
    };

    const getCinemaList = async () => {
      setState((prev) => ({ ...prev, isFetch: true }));
      try {
        const res = await getCinemasWithCityAPI();
        setState((prev) => ({ ...prev, cinemaList: res }));
      } catch (error) {
        console.log(error);
      }
    };

    createDateList();
    getMovieList();
    getCinemaList();
  }, []);
  return (
    <div className="flex flex-col gap-3 border-b border-b-gray-400 pb-10 sm:flex-row">
      {/* ngày */}
      <div className={`basis-3/12 ${styles.item_filter}`}>
        <div className={`${styles.select_label}`}>
          <div>1. Ngày</div>
          <span>
            <FontAwesomeIcon icon={faCalendar} />
          </span>
        </div>
        <div>
          <Select
            className={styles.select}
            value={valueSelected.date}
            onChange={(v) => setValueSelected("date", v)}
            classNames={{
              popup: {
                root: styles.dropdown,
              },
            }}
            options={
              state.dateList?.length > 0
                ? state.dateList.map((d) => ({
                    label: d.dateDisplay,
                    value: d.value,
                  }))
                : []
            }
          />
        </div>
      </div>
      {/* phim */}
      <div className={`basis-6/12 ${styles.item_filter}`}>
        <div className={`${styles.select_label}`}>
          <div>2. Phim</div>
          <span>
            <FontAwesomeIcon icon={faFilm} />
          </span>
        </div>

        <div>
          <Select
            value={valueSelected.movie}
            onChange={(v) => setValueSelected("movie", v)}
            className={styles.select}
            placeholder="Chọn phim"
            classNames={{
              popup: {
                root: styles.dropdown,
              },
            }}
            options={
              state.movieList?.length > 0
                ? state.movieList.map((m) => ({
                    label: m.name,
                    value: Number(m.id),
                  }))
                : []
            }
          />
        </div>
      </div>
      {/* rạp */}
      <div className={`basis-3/12 ${styles.item_filter}`}>
        <div className={`${styles.select_label}`}>
          <div>3. Rạp</div>
          <span>
            <FontAwesomeIcon icon={faLocationDot} />
          </span>
        </div>

        <div>
          <Select
            value={valueSelected.cinema}
            onChange={(v) => setValueSelected("cinema", v)}
            className={styles.select}
            placeholder="Chọn rạp"
            options={
              state.cinemaList?.length > 0
                ? state.cinemaList.map((c) => ({
                    label: c.name + " (" + c.province + ")",
                    value: Number(c.cinema_id),
                  }))
                : []
            }
            classNames={{
              popup: {
                root: styles.dropdown,
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default ShowtimePageSelectBar;
