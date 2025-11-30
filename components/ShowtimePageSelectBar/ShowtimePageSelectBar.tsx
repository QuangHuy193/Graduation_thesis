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
import { weekdays } from "@/lib/constant";

function ShowtimePageSelectBar() {
  const [state, setState] = useState({
    dateList: [],
    movieList: [],
    cinemaList: [
      {
        id: 1,
        name: "testttttttttttttttttt",
      },
      {
        id: 2,
        name: "testtttttttttt",
      },
      {
        id: 3,
        name: "testtttttttttttttttttttt",
      },
    ],
  });

  useEffect(() => {
    const createDateList = () => {
      let list = [];
      const today = new Date();

      for (let i = 0; i < 5; i++) {
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
      console.log(list);
    };
    createDateList();
  }, []);
  return (
    <div>
      <div className="flex gap-3">
        <div className={`flex-3/12 ${styles.item_filter}`}>
          <div className={`${styles.select_label}`}>
            <div>1. Ngày</div>
            <span>
              <FontAwesomeIcon icon={faCalendar} />
            </span>
          </div>
          <div>
            <Select
              className={styles.select}
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
        <div className={`flex-6/12 ${styles.item_filter}`}>
          <div className={`${styles.select_label}`}>
            <div>2. Phim</div>
            <span>
              <FontAwesomeIcon icon={faFilm} />
            </span>
          </div>

          <div>
            <Select
              className={styles.select}
              placeholder="Chọn phim"
              classNames={{
                popup: {
                  root: styles.dropdown,
                },
              }}
            />
          </div>
        </div>
        <div className={`flex-3/12 ${styles.item_filter}`}>
          <div className={`${styles.select_label}`}>
            <div>3. Rạp</div>
            <span>
              <FontAwesomeIcon icon={faLocationDot} />
            </span>
          </div>

          <div>
            <Select
              className={styles.select}
              placeholder="Chọn rạp"
              options={
                state.cinemaList?.length > 0
                  ? state.cinemaList.map((c) => ({
                      label: c.name,
                      value: Number(c.id),
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
    </div>
  );
}

export default ShowtimePageSelectBar;
