"use client";

import BarTicket from "@/components/BarTicket/BarTicket";
import MovieList from "@/components/MovieList/MovieList";
import {
  getMovieShowingAllAPI,
  getMovieUpcommingAllAPI,
} from "@/lib/axios/movieAPI";
import { useEffect, useState } from "react";

function MoviePage() {
  const [state, setState] = useState({
    movieShowingList: [],
    movieUpcomingList: [],
  });
  useEffect(() => {
    const getMovieShowing = async () => {
      try {
        const res = await getMovieShowingAllAPI();
        setState((prev) => ({ ...prev, movieShowingList: res }));
      } catch (error) {
        console.log(error);
      }
    };

    const getMovieUpcoming = async () => {
      try {
        const res = await getMovieUpcommingAllAPI();
        setState((prev) => ({ ...prev, movieUpcomingList: res }));
      } catch (error) {
        console.log(error);
      }
    };

    getMovieShowing();
    getMovieUpcoming();
  }, []);
  return (
    <div>
      <div>
        <BarTicket />
      </div>
      <div>
        <div className="pb-[50px]">
          <MovieList
            data={state.movieShowingList}
            title="PHIM ĐANG CHIẾU"
            link="/movie/showing"
          />
        </div>

        <div className="pb-[50px]">
          <MovieList
            data={state.movieUpcomingList}
            title="PHIM SẮP CHIẾU"
            link="/movie/upcoming"
          />
        </div>
      </div>
    </div>
  );
}

export default MoviePage;
