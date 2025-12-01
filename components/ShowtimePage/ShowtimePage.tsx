"use client";
import { useEffect, useState } from "react";
import ShowtimePageSelectBar from "../ShowtimePageSelectBar/ShowtimePageSelectBar";
import { getMovieAndShowtimeAndCinemaDetailAPI } from "@/lib/axios/movieAPI";
import ShowtimePageList from "../ShowtimePageItem/ShowtimePageList";

function ShowtimePage() {
  const [state, setState] = useState({
    dataApi: [],
    dataDisplay: [],
    isFetch: false,
    valueSelected: {
      date: null,
      movie: null,
      cinema: null,
    },
  });

  // gọi api lấy ds phim
  useEffect(() => {
    const getMovieShowtime = async () => {
      try {
        const res = await getMovieAndShowtimeAndCinemaDetailAPI();
        // console.log("api", res);
        setState((prev) => ({ ...prev, dataApi: res }));
      } catch (error) {
        console.log(error);
      }
    };

    getMovieShowtime();
  }, []);

  // Lần đầu: lọc theo ngày nếu date đã có sẵn
  useEffect(() => {
    if (
      state.dataApi.length > 0 &&
      state.valueSelected.date &&
      !state.valueSelected.movie &&
      !state.valueSelected.cinema
    ) {
      const result = state.dataApi
        .map((item) => ({
          ...item,
          dates: item.dates.filter((d) => d.date === state.valueSelected.date),
        }))
        .filter((item) => item.dates.length > 0);

      setState((prev) => ({ ...prev, dataDisplay: result }));
    }
  }, [state.dataApi, state.valueSelected.date]);

  // lọc dữ liệu
  useEffect(() => {
    const filter = (
      date: Date | null,
      movie: number | null,
      cinema: number | null
    ) => {
      let result = state.dataApi;

      // Lọc theo date
      if (date) {
        console.log("trước khi lọc ngày: ", state.dataApi);
        result = result
          .map((item) => ({
            ...item,
            dates: item.dates.filter((d) => d.date === date),
          }))
          .filter((item) => item.dates.length > 0);
        console.log("lọc ngày: ", result);
      }

      // Lọc theo movie
      if (movie) {
        result = result.filter((item) => item.movie_id === Number(movie));
        console.log("lọc phim: ", result);
      }

      // Lọc theo cinema
      if (cinema) {
        result = result
          .map((item) => ({
            ...item,
            dates: item.dates
              .map((d) => ({
                ...d,
                cinemas: d.cinemas.filter(
                  (c) => c.cinema_id === Number(cinema)
                ),
              }))
              .filter((d) => d.cinemas.length > 0),
          }))
          .filter((item) => item.dates.length > 0);
        console.log("lọc rạp: ", result);
      }

      // Cập nhật state
      setState((prev) => ({
        ...prev,
        dataDisplay: result,
      }));
    };

    filter(
      state.valueSelected.date,
      state.valueSelected.movie,
      state.valueSelected.cinema
    );
  }, [state.valueSelected]);
  return (
    <div>
      <ShowtimePageSelectBar
        valueSelected={state.valueSelected}
        setValueSelected={(name: string, v: number | Date) =>
          setState((prev) => ({
            ...prev,
            valueSelected: {
              ...prev.valueSelected,
              [name]: v,
            },
          }))
        }
      />
      <ShowtimePageList data={state.dataDisplay} size="lagre" />
    </div>
  );
}

export default ShowtimePage;
