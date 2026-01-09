"use client";
import {
  getRevenueCinemaAPI,
  getRevenueMovieAPI,
} from "@/lib/axios/sadmin/revenueAPI";
import { fmtCurrency } from "@/lib/function";
import { useEffect, useState } from "react";

function ItemRevenue({ selected, itemType, itemTitle, itemSubTitle }) {
  const [state, setState] = useState({
    revenueMax: 0,
    revenueMin: 0,
  });

  useEffect(() => {
    const getRevenueMaxMin = async () => {
      try {
        let res;
        if (itemType === "movie") {
          if (selected.type === "year") {
            res = await getRevenueMovieAPI(selected.year);
          } else if (selected.type === "month") {
            res = await getRevenueMovieAPI(selected.year, selected.month);
          }
        } else if (itemType === "cinema") {
          if (selected.type === "year") {
            res = await getRevenueCinemaAPI(selected.year);
          } else if (selected.type === "month") {
            res = await getRevenueCinemaAPI(selected.year, selected.month);
          }
        }
        setState((prev) => ({
          ...prev,
          revenueMax: res.max,
          revenueMin: res.min,
        }));
      } catch (error) {
        console.log(error);
      }
    };

    getRevenueMaxMin();
  }, [selected]);
  return (
    <div className="p-2">
      {/* Title */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-800">
          {selected.type === "year"
            ? `${itemTitle} theo năm`
            : `${itemTitle} theo tháng`}
        </h2>
        <div className="mt-1 h-1 w-16 bg-blue-500 rounded-full" />
      </div>

      {/* Max */}
      <div className="flex justify-between items-center py-3 border-b">
        <div>
          <div className="text-sm text-gray-500">
            {itemSubTitle} doanh thu cao nhất
          </div>
          <div className="font-medium text-gray-800">
            {state.revenueMax?.name || "—"}
          </div>
        </div>
        <div className="font-semibold text-green-600">
          {state.revenueMax?.revenue
            ? fmtCurrency(state.revenueMin.revenue)
            : "—"}
        </div>
      </div>

      {/* Min */}
      <div className="flex justify-between items-center pt-3">
        <div>
          <div className="text-sm text-gray-500">
            {itemSubTitle} doanh thu thấp nhất
          </div>
          <div className="font-medium text-gray-800">
            {state.revenueMin?.name || "—"}
          </div>
        </div>
        <div className="font-semibold text-red-500">
          {state.revenueMin?.revenue
            ? fmtCurrency(state.revenueMin.revenue)
            : "—"}
        </div>
      </div>
    </div>
  );
}

export default ItemRevenue;
