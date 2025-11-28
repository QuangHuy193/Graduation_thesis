"use client";
import {
  getMovieShowingAllAPI,
  getMovieUpcommingAllAPI,
} from "@/lib/axios/movieAPI";
import { useEffect, useState } from "react";
import Spinner from "../Spinner/Spinner";
import MovieItem from "../MovieItem/MovieItem";

function MovieListPage({ type }: { type: string }) {
  const [movieList, setMovieList] = useState([]);
  useEffect(() => {
    const getMovieList = async (type: string) => {
      try {
        let res = [];
        if (type === "showing") {
          res = await getMovieShowingAllAPI();
        } else if (type === "upcoming") {
          res = await getMovieUpcommingAllAPI();
        }
        setMovieList(res);
      } catch (error) {
        console.log(error);
      }
    };

    getMovieList(type);
  }, [type]);
  return (
    <div className="pt-5">
      <div className="text-4xl font-bold py-8 flex justify-center">
        {type === "showing" && "PHIM ĐANG CHIẾU"}
        {type === "upcoming" && "PHIM SẮP CHIẾU"}
      </div>
      {movieList.length !== 0 ? (
        <div className="grid grid-cols-4 gap-5">
          {movieList.map((m, idx) => (
            <div key={idx}>
              <MovieItem data={m} />
            </div>
          ))}
        </div>
      ) : (
        <Spinner />
      )}
    </div>
  );
}

export default MovieListPage;
