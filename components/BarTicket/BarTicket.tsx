"use client";
import { getCinemasWithCityAPI } from "@/lib/axios/cinemasAPI";
import { CinemaOnlyCity } from "@/lib/interface/cinemaInterface";
import { useEffect, useState } from "react";
import styles from "./BarTicket.module.scss";
import Button from "../Button/Button";
import { Select } from "antd";
import Spinner from "../Spinner/Spinner";
import { getMovieWithCinemaIdAPI } from "@/lib/axios/movieAPI";
import {
  getDateInShowtimeByCinemaMovieAPI,
  getTimeInShowtimeByCinemaMovieDateAPI,
} from "@/lib/axios/showTimeAPI";
import { weekdays } from "@/lib/constant";

function BarTicket() {
  // kiểm tra loại giao diện
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  const [state, setState] = useState({
    // danh sách rạp
    cinemaList: [],
    // danh sách phim theo rạp
    movieList: [],
    // danh sách ngày theo lịch chiếu phim
    dateList: [],
    //danh sách suất theo ngày
    timeList: [],
    // các trường chọn
    valueSelected: {
      cinema: null,
      movie: null,
      date: null,
      times: null,
    },
    isFetch: false,
  });

  useEffect(() => {
    const getDataCinemas = async () => {
      try {
        const res = await getCinemasWithCityAPI();
        setState((prev) => ({ ...prev, cinemaList: res }));
      } catch (error) {
        console.log(error);
      }
    };

    getDataCinemas();
  }, []);

  // khi chọn rạp
  useEffect(() => {
    setState((prev) => ({
      ...prev,
      valueSelected: { ...prev.valueSelected, movie: null },
    }));

    const getDataMovie = async (id: number) => {
      try {
        setState((prev) => ({
          ...prev,
          isFetch: true,
        }));
        const res = await getMovieWithCinemaIdAPI(id);
        setState((prev) => ({ ...prev, movieList: res }));
      } catch (error) {
        console.log(error);
      } finally {
        setState((prev) => ({
          ...prev,
          isFetch: false,
        }));
      }
    };

    if (state.valueSelected.cinema != null) {
      getDataMovie(state.valueSelected.cinema);
    }
  }, [state.valueSelected.cinema]);

  // khi chọn phim
  useEffect(() => {
    setState((prev) => ({
      ...prev,
      valueSelected: { ...prev.valueSelected, date: null },
    }));

    const getDataDate = async (movie_id: number, cinema_id: number) => {
      try {
        setState((prev) => ({
          ...prev,
          isFetch: true,
        }));
        const res = await getDateInShowtimeByCinemaMovieAPI(
          movie_id,
          cinema_id
        );
        setState((prev) => ({ ...prev, dateList: res }));
      } catch (error) {
        console.log(error);
      } finally {
        setState((prev) => ({
          ...prev,
          isFetch: false,
        }));
      }
    };

    if (
      state.valueSelected.cinema != null &&
      state.valueSelected.movie != null
    ) {
      getDataDate(state.valueSelected.movie, state.valueSelected.cinema);
    }
  }, [state.valueSelected.movie, state.valueSelected.cinema]);

  // khi chọn ngày
  useEffect(() => {
    setState((prev) => ({
      ...prev,
      valueSelected: { ...prev.valueSelected, times: null },
    }));

    const getDataTime = async (
      movie_id: number,
      cinema_id: number,
      showtime_id: number
    ) => {
      try {
        setState((prev) => ({
          ...prev,
          isFetch: true,
        }));
        const res = await getTimeInShowtimeByCinemaMovieDateAPI(
          movie_id,
          cinema_id,
          showtime_id
        );
        setState((prev) => ({ ...prev, timeList: res }));
      } catch (error) {
        console.log(error);
      } finally {
        setState((prev) => ({
          ...prev,
          isFetch: false,
        }));
      }
    };

    if (
      state.valueSelected.cinema != null &&
      state.valueSelected.movie != null &&
      state.valueSelected.date != null
    ) {
      getDataTime(
        state.valueSelected.movie,
        state.valueSelected.cinema,
        state.valueSelected.date
      );
    }
  }, [
    state.valueSelected.date,
    state.valueSelected.cinema,
    state.valueSelected.movie,
  ]);

  // set giá trị đặt vé nhanh cho movieDetail đọc
  const handleSetQuickTicket = () => {
    const quickTicket = {
      // number
      movie_id: state.valueSelected.movie,
      // date
      date: state.valueSelected.date,
      // number
      times: state.valueSelected.times,
    };
    sessionStorage.setItem("quickticket", JSON.stringify(quickTicket));
  };

  return (
    <div
      className="w-full bg-white rounded-sm lg:flex md:flex
    items-center justify-between px-5 py-4"
    >
      <div>
        <div
          className="text-2xl md:text-[16px] text-gray-400 font-bold justify-center
        flex pb-3 md:pb-0"
        >
          ĐẶT VÉ NHANH
        </div>
      </div>

      <div className="flex flex-col gap-2 md:flex-row ">
        {/* rạp */}
        <div className="flex justify-center">
          <Select
            popupMatchSelectWidth={isMobile ? true : false}
            notFoundContent={<Spinner text="Đang tải danh sách rạp" />}
            className={styles.select}
            classNames={{
              popup: {
                root: styles.dropdown,
              },
            }}
            placeholder="Chọn rạp"
            value={state.valueSelected.cinema ?? null}
            onChange={(v) =>
              setState((prev) => ({
                ...prev,
                valueSelected: { ...prev.valueSelected, cinema: v },
              }))
            }
            options={
              state.cinemaList?.length > 0
                ? state.cinemaList.map((c: CinemaOnlyCity) => ({
                    label: c.name,
                    value: Number(c.cinema_id),
                  }))
                : []
            }
          />
        </div>

        {/* phim */}
        <div className="flex justify-center">
          <Select
            popupMatchSelectWidth={isMobile ? true : false}
            notFoundContent={
              state.isFetch ? (
                <Spinner text="Đang tải danh sách phim" />
              ) : state.movieList.length === 0 ? (
                "Hiện không có phim chiếu ở rạp này."
              ) : (
                ""
              )
            }
            disabled={state.valueSelected.cinema === null}
            className={styles.select}
            classNames={{
              popup: {
                root: styles.dropdown,
              },
            }}
            placeholder="Chọn phim"
            value={state.valueSelected.movie ?? null}
            onChange={(v) =>
              setState((prev) => ({
                ...prev,
                valueSelected: { ...prev.valueSelected, movie: v },
              }))
            }
            options={
              state.movieList?.length > 0
                ? state.movieList.map((m) => ({
                    label: m.name,
                    value: Number(m.movie_id),
                  }))
                : []
            }
          />
        </div>

        {/* ngày */}
        <div className="flex justify-center">
          <Select
            popupMatchSelectWidth={isMobile ? true : false}
            notFoundContent={
              state.isFetch ? (
                <Spinner text="Đang tải danh sách ngày chiếu" />
              ) : state.dateList.length === 0 ? (
                "Hiện chưa có lịch chiếu của phim này."
              ) : (
                ""
              )
            }
            disabled={state.valueSelected.movie === null}
            className={styles.select}
            classNames={{
              popup: {
                root: styles.dropdown,
              },
            }}
            placeholder="Chọn ngày"
            value={state.valueSelected.date ?? null}
            onChange={(v) =>
              setState((prev) => ({
                ...prev,
                valueSelected: { ...prev.valueSelected, date: v },
              }))
            }
            options={
              state.dateList?.length > 0
                ? state.dateList.map((d) => ({
                    label: weekdays[d.weekday] + " " + d.dateDisplay,
                    value: d.date,
                  }))
                : []
            }
          />
        </div>

        {/* suất */}
        <div className="flex justify-center">
          <Select
            popupMatchSelectWidth={isMobile ? true : false}
            notFoundContent={
              state.isFetch ? (
                <Spinner text="Đang tải danh sách suất chiếu" />
              ) : state.timeList.length === 0 ? (
                "Hiện chưa có suất chiếu cho ngày này."
              ) : (
                ""
              )
            }
            disabled={state.valueSelected.date === null}
            className={styles.select}
            classNames={{
              popup: {
                root: styles.dropdown,
              },
            }}
            placeholder="Chọn suất"
            value={state.valueSelected.times ?? null}
            onChange={(v) =>
              setState((prev) => ({
                ...prev,
                valueSelected: { ...prev.valueSelected, times: v },
              }))
            }
            options={
              state.timeList?.length > 0
                ? state.timeList.map((c) => ({
                    label: c.start_time,
                    value: Number(c.movie_screen_id),
                  }))
                : []
            }
          />
        </div>
        <div
          className="relative flex justify-center"
          onClick={handleSetQuickTicket}
        >
          <div className="relative inline-block">
            <Button
              text="ĐẶT NGAY"
              link={`/movie/${state.valueSelected.movie}`}
            />

            {state.valueSelected.times === null && (
              <div className="absolute inset-0 z-10 bg-black/20 rounded-sm"></div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default BarTicket;
