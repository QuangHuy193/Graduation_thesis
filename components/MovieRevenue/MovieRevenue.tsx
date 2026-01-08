"use client";
import { getRevenueMovieAPI } from "@/lib/axios/sadmin/revenueAPI";
import { useEffect, useState } from "react";

function MovieRevenue({ selected }) {
  const [state, setState] = useState({
    movieRevenueMax: 0,
    movieRevenueMin: 0,
  });

  useEffect(() => {
    const getMovieRevenueMaxMin = async () => {
      try {
        let res;
        if (selected.type === "year") {
          res = await getRevenueMovieAPI(selected.year);
        } else if (selected.type === "month") {
          res = await getRevenueMovieAPI(selected.year, selected.month);
        }
        setState((prev) => ({
          ...prev,
          movieRevenueMax: res.max,
          movieRevenueMin: res.min,
        }));
      } catch (error) {
        console.log(error);
      }
    };

    getMovieRevenueMaxMin();
  }, [selected]);
  return (
    <div className="p-2">
      {/* Title */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-800">
          {selected.type === "year"
            ? "Doanh thu phim theo năm"
            : "Doanh thu phim theo tháng"}
        </h2>
        <div className="mt-1 h-1 w-16 bg-blue-500 rounded-full" />
      </div>

      {/* Max */}
      <div className="flex justify-between items-center py-3 border-b">
        <div>
          <div className="text-sm text-gray-500">
            🎬 Phim doanh thu cao nhất
          </div>
          <div className="font-medium text-gray-800">
            {state.movieRevenueMax?.name || "—"}
          </div>
        </div>
        <div className="font-semibold text-green-600">
          {state.movieRevenueMax?.revenue
            ? state.movieRevenueMax.revenue.toLocaleString("vi-VN") + " ₫"
            : "—"}
        </div>
      </div>

      {/* Min */}
      <div className="flex justify-between items-center pt-3">
        <div>
          <div className="text-sm text-gray-500">
            🎟️ Phim doanh thu thấp nhất
          </div>
          <div className="font-medium text-gray-800">
            {state.movieRevenueMin?.name || "—"}
          </div>
        </div>
        <div className="font-semibold text-red-500">
          {state.movieRevenueMin?.revenue
            ? state.movieRevenueMin.revenue.toLocaleString("vi-VN") + " ₫"
            : "—"}
        </div>
      </div>
    </div>
  );
}

export default MovieRevenue;
