"use client";
import { useEffect, useState } from "react";
import Spinner from "../Spinner/Spinner";
import MovieList from "../MovieList/MovieList";
import { searchMovieAPI } from "@/lib/axios/movieAPI";

function SearchPage({ keyword }: { keyword: string }) {
  const [state, setState] = useState({
    isFetch: false,
    movieList: [],
  });

  useEffect(() => {
    const getMovieSearch = async (name: string) => {
      try {
        setState((prev) => ({ ...prev, isFetch: true }));
        const res = await searchMovieAPI(name);
        setState((prev) => ({ ...prev, movieList: res }));
      } catch (error) {
        console.log(error);
      } finally {
        setState((prev) => ({ ...prev, isFetch: false }));
      }
    };

    getMovieSearch(keyword);
  }, [keyword]);

  return (
    <div>
      {state.isFetch ? (
        <div className="py-30">
          <Spinner />
        </div>
      ) : state.movieList.length === 0 ? (
        <div
          className="w-full h-full flex justify-center items-center
        py-30"
        >
          Không có kết quả tìm kiếm!
        </div>
      ) : (
        <div>
          <div className="uppercase font-bold text-4xl flex justify-center py-5">
            Kết quả tìm kiếm phim
          </div>
          <MovieList data={state.movieList} more={false} />
        </div>
      )}
    </div>
  );
}

export default SearchPage;
