"use client";
import { getCinemasWithCityAPI } from "@/lib/axios/cinemasAPI";
import { CinemaOnlyCity } from "@/lib/interface/cinemaInterface";
import { useEffect, useState } from "react";
import styles from "./BarTicket.module.scss";
import Button from "../Button/Button";
import { Select } from "antd";

function BarTicket() {
  const [cinemas, setCinemas] = useState([]);
  const [movies, setsetMovies] = useState([]);
  const [date, setDate] = useState([]);
  const [times, setTimes] = useState([]);
  const [valueSelected, setValueSelected] = useState({
    cinema: "",
    movie: "",
    date: "",
    times: "",
  });

  useEffect(() => {
    const getDataCinemas = async () => {
      const res = await getCinemasWithCityAPI();
      setCinemas(res);
    };

    getDataCinemas();
  }, []);
  return (
    <div
      className="w-full bg-white rounded-sm flex 
    items-center justify-between px-5 py-4"
    >
      <div>
        <div className="text-2xl text-gray-400 font-bold">ĐẶT VÉ NHANH</div>
      </div>

      {/* rạp */}
      <div className="flex gap-2">
        <Select
          notFoundContent={"Đang tải danh sách rạp..."}
          className={styles.select}
          classNames={{
            popup: {
              root: "my-custom-dropdown",
            },
          }}
          placeholder="Chọn rạp"
          value={valueSelected.cinema || undefined}
          onChange={(v) => setValueSelected((p) => ({ ...p, cinema: v }))}
          options={
            cinemas?.length > 0
              ? cinemas.map((c: CinemaOnlyCity) => ({
                  label: c.name,
                  value: String(c.cinema_id),
                }))
              : []
          }
        />

        {/* phim */}
        <div>
          <Select
            notFoundContent={"Đang tải danh sách phim..."}
            disabled={valueSelected.cinema === ""}
            className={styles.select}
            classNames={{
              popup: {
                root: "my-custom-dropdown",
              },
            }}
            placeholder="Chọn phim"
            value={valueSelected.movie || undefined}
            onChange={(v) => setValueSelected((p) => ({ ...p, movie: v }))}
            options={
              cinemas?.length > 0
                ? cinemas.map((c: CinemaOnlyCity) => ({
                    label: c.name,
                    value: String(c.cinema_id),
                  }))
                : []
            }
          />
        </div>

        {/* ngày */}
        <div>
          <Select
            notFoundContent={"Đang tải danh sách ngày chiếu..."}
            disabled={valueSelected.movie === ""}
            className={styles.select}
            classNames={{
              popup: {
                root: "my-custom-dropdown",
              },
            }}
            placeholder="Chọn ngày"
            value={valueSelected.date || undefined}
            onChange={(v) => setValueSelected((p) => ({ ...p, date: v }))}
            options={
              cinemas?.length > 0
                ? cinemas.map((c: CinemaOnlyCity) => ({
                    label: c.name,
                    value: String(c.cinema_id),
                  }))
                : []
            }
          />
        </div>

        {/* suất */}
        <div>
          <Select
            notFoundContent={"Đang tải danh sách suất chiếu..."}
            disabled={valueSelected.date === ""}
            className={styles.select}
            classNames={{
              popup: {
                root: "my-custom-dropdown",
              },
            }}
            placeholder="Chọn suất"
            value={valueSelected.times || undefined}
            onChange={(v) => setValueSelected((p) => ({ ...p, times: v }))}
            options={
              cinemas?.length > 0
                ? cinemas.map((c: CinemaOnlyCity) => ({
                    label: c.name,
                    value: String(c.cinema_id),
                  }))
                : []
            }
          />
        </div>
        <div>
          <Button text="ĐẶT NGAY" />
        </div>
      </div>
    </div>
  );
}

export default BarTicket;
