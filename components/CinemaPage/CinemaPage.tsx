"use client";
import { useEffect, useState } from "react";
import styles from "./CinemaPage.module.scss";
import {
  getMovieShowAndShowtimeByCinemaIdAPI,
  getMovieShowAndUpcometimeByCinemaIdAPI,
} from "@/lib/axios/movieAPI";
import MovieListInCinema from "../MovieListInCinema/MovieListInCinema";
import Spinner from "../Spinner/Spinner";
import { getTablePriceAPI } from "@/lib/axios/cinemasAPI";
import { getPrice } from "@/lib/function";

function CinemaPage({ cinema_id }: { cinema_id: number }) {
  const [state, setState] = useState({
    isFetch: false,
    tab: 0,
    movieList: [],
    priceList: [],
  });

  useEffect(() => {
    const getMovieShowing = async (id: number) => {
      try {
        setState((prev) => ({ ...prev, isFetch: true }));
        const res = await getMovieShowAndShowtimeByCinemaIdAPI(id);
        setState((prev) => ({ ...prev, movieList: res }));
      } catch (error) {
        console.log(error);
      } finally {
        setState((prev) => ({ ...prev, isFetch: false }));
      }
    };

    const getMovieUpcoming = async (id: number) => {
      try {
        setState((prev) => ({ ...prev, isFetch: true }));
        const res = await getMovieShowAndUpcometimeByCinemaIdAPI(id);
        setState((prev) => ({ ...prev, movieList: res }));
      } catch (error) {
        console.log(error);
      } finally {
        setState((prev) => ({ ...prev, isFetch: false }));
      }
    };

    const getTablePrice = async (id: number) => {
      try {
        setState((prev) => ({ ...prev, isFetch: true }));
        const res = await getTablePriceAPI(id);
        setState((prev) => ({ ...prev, priceList: res }));
      } catch (error) {
        console.log(error);
      } finally {
        setState((prev) => ({ ...prev, isFetch: false }));
      }
    };

    if (state.tab === 0) {
      getMovieShowing(cinema_id);
    }

    if (state.tab === 1) {
      getMovieUpcoming(cinema_id);
    }

    if (state.tab === 2) {
      getTablePrice(cinema_id);
    }
  }, [cinema_id, state.tab]);

  useEffect(() => {
    return () => {
      sessionStorage.removeItem("cinema");
    };
  }, []);

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
        {(state.tab === 0 || state.tab === 1) &&
          (state.isFetch ? (
            <div className="py-10">
              <Spinner />
            </div>
          ) : (
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
          ))}
        {/* Bảng giá vé */}
        {state.tab === 2 &&
          (state.isFetch ? (
            <div className="py-10">
              <Spinner />
            </div>
          ) : (
            <div>
              <h1 className="font-bold text-4xl flex justify-center items-center pt-10 pb-5">
                BẢNG GIÁ VÉ
              </h1>
              <div className="overflow-x-auto">
                <table className="w-full border border-gray-300 rounded-lg overflow-hidden text-sm">
                  {/* Header */}
                  <thead className="bg-linear-to-r from-indigo-700 to-blue-600 text-white">
                    <tr>
                      <th className="px-4 py-3 text-left">Ngày trong tuần</th>
                      <th className="px-4 py-3 text-center">Suất chiếu</th>
                      <th className="px-4 py-3 text-center">🎉 Lễ tết</th>
                      <th className="px-4 py-3 text-center">👤 Thường</th>
                      <th className="px-4 py-3 text-center">🎓 HSSV</th>
                    </tr>
                  </thead>

                  {/* Body */}
                  <tbody className="bg-white text-gray-800">
                    {state.priceList.map((day) =>
                      ["18:00", "22:00"].map((time, index) => (
                        <tr
                          key={`${day.day_of_week}-${time}`}
                          className="hover:bg-gray-50 transition border-b border-gray-300"
                        >
                          {/* Gộp ngày */}
                          {index === 0 && (
                            <td
                              rowSpan={2}
                              className="px-4 py-4 font-semibold bg-gray-100 border-r border-gray-300
                              "
                            >
                              {day.day_of_week === 1
                                ? "Thứ 2"
                                : day.day_of_week === 30
                                ? "Thứ 3 – Thứ 6"
                                : "Thứ 7 & Chủ nhật"}
                            </td>
                          )}

                          {/* Suất chiếu */}
                          <td className="px-4 py-3 text-center font-medium">
                            {time === "18:00"
                              ? "18:00 – 22:00"
                              : "22:00 – 18:00"}
                          </td>

                          {/* Lễ tết */}
                          <td className="px-4 py-3 text-center font-semibold text-red-600">
                            {getPrice(day.prices, time, 1, 1).toLocaleString(
                              "vi-VN"
                            )}
                          </td>

                          {/* Thường */}
                          <td className="px-4 py-3 text-center font-semibold text-blue-700">
                            {getPrice(day.prices, time, 0, 1).toLocaleString(
                              "vi-VN"
                            )}
                          </td>

                          {/* HSSV */}
                          <td className="px-4 py-3 text-center font-semibold text-green-600">
                            {getPrice(day.prices, time, 0, 2).toLocaleString(
                              "vi-VN"
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
                <div className="mt-4 rounded-lg border border-yellow-300 bg-yellow-50 px-4 py-3">
                  <h3 className="mb-1 flex items-center gap-2 text-sm font-semibold text-yellow-800">
                    ⚠️ Ghi chú
                  </h3>

                  <ul className="list-disc pl-5 text-sm text-yellow-700 space-y-1">
                    <li>
                      Phụ thu thêm{" "}
                      <span className="font-semibold text-red-600">5.000đ</span>{" "}
                      với phim bom tấn
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}

export default CinemaPage;
