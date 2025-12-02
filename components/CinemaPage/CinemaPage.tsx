"use client";
import { useEffect, useState } from "react";
import styles from "./CinemaPage.module.scss";
import {
  getMovieShowAndShowtimeByCinemaIdAPI,
  getMovieShowAndUpcometimeByCinemaIdAPI,
} from "@/lib/axios/movieAPI";
import MovieListInCinema from "../MovieListInCinema/MovieListInCinema";

function CinemaPage({ cinema_id }: { cinema_id: number }) {
  const [state, setState] = useState({
    tab: 0,
    movieList: [],
  });

  useEffect(() => {
    const getMovieShowing = async (id: number) => {
      try {
        const res = await getMovieShowAndShowtimeByCinemaIdAPI(id);
        setState((prev) => ({ ...prev, movieList: res }));
      } catch (error) {
        console.log(error);
      }
    };

    const getMovieUpcoming = async (id: number) => {
      try {
        const res = await getMovieShowAndUpcometimeByCinemaIdAPI(id);
        setState((prev) => ({ ...prev, movieList: res }));
      } catch (error) {
        console.log(error);
      }
    };

    if (state.tab === 0) {
      getMovieShowing(cinema_id);
    }

    if (state.tab === 1) {
      getMovieUpcoming(cinema_id);
    }
  }, [cinema_id, state.tab]);
  return (
    <div>
      {/* tab */}
      <div className="flex bg-linear-to-r from-[#3C2B63] via-[#0F172B] to-[#131E3A">
        <div
          className={`${styles.tab_item} ${
            state.tab === 0 ? "text-(--color-yellow)" : ""
          }`}
          onClick={() => setState((prev) => ({ ...prev, tab: 0 }))}
        >
          PHIM ĐANG CHIẾU
          {state.tab === 0 && <span></span>}
        </div>
        <div
          className={`${styles.tab_item} ${
            state.tab === 1 ? "text-(--color-yellow)" : ""
          }`}
          onClick={() => setState((prev) => ({ ...prev, tab: 1 }))}
        >
          PHIM SẮP CHIẾU{state.tab === 1 && <span></span>}
        </div>
        <div
          className={`${styles.tab_item} ${
            state.tab === 2 ? "text-(--color-yellow)" : ""
          }`}
          onClick={() => setState((prev) => ({ ...prev, tab: 2 }))}
        >
          BẢNG GIÁ VÉ{state.tab === 2 && <span></span>}
        </div>
      </div>

      {/* content */}
      <div>
        {/* ds phim */}
        {(state.tab === 0 || state.tab === 1) && (
          <MovieListInCinema
            data={state.movieList}
            text={
              state.tab === 0
                ? "PHIM ĐANG CHIẾU"
                : state.tab === 1
                ? "PHIM SẮP CHIẾU"
                : ""
            }
          />
        )}
      </div>
    </div>
  );
}

export default CinemaPage;
