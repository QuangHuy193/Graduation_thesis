"use client";
import BarTicket from "@/components/BarTicket/BarTicket";
import LoadingPage from "@/components/LoadingPage/LoadingPage";
import MovieList from "@/components/MovieList/MovieList";
import PromotionList from "@/components/PromotionList/PromotionList";
import {
  getMovieShowingBanerAPI,
  getMovieUpcommingBanerAPI,
} from "@/lib/axios/movieAPI";
import { getPromotionsAPI } from "@/lib/axios/promotionAPI";
import { useEffect, useState } from "react";

export default function Home() {
  const [bannerMovieShowng, setBannerMovieShowng] = useState([]);
  const [bannerMovieUpcoming, setBannerMovieUpcoming] = useState([]);
  const [promotionList, setPromotionList] = useState([]);

  useEffect(() => {
    const getMovieShowingBaner = async () => {
      try {
        const res = await getMovieShowingBanerAPI();
        setBannerMovieShowng(res);
      } catch (error) {
        console.log(error);
      }
    };

    const getMovieUpcomingBanner = async () => {
      try {
        const res = await getMovieUpcommingBanerAPI();
        setBannerMovieUpcoming(res);
      } catch (error) {
        console.log(error);
      }
    };

    const getPromotionList = async () => {
      try {
        const res = await getPromotionsAPI();
        setPromotionList(res);
      } catch (error) {
        console.log(error);
      }
    };

    getMovieShowingBaner();
    getMovieUpcomingBanner();
    getPromotionList();
  }, []);

  if (
    bannerMovieShowng.length === 0 ||
    bannerMovieUpcoming.length === 0 ||
    promotionList.length === 0
  ) {
    return (
      <div>
        <LoadingPage />
      </div>
    );
  }

  return (
    <div>
      <div>
        <div>
          <BarTicket />
        </div>

        <div>
          <div className="pb-[50px]">
            <MovieList
              data={bannerMovieShowng}
              title="PHIM ĐANG CHIẾU"
              link="/movie/showing"
            />
          </div>

          <div className="pb-[50px]">
            <MovieList
              data={bannerMovieUpcoming}
              title="PHIM SẮP CHIẾU"
              link="/movie/upcoming"
            />
          </div>

          <div className="pb-[50px]">
            <PromotionList
              data={promotionList}
              title="KHUYẾN MÃI"
              link={"/promotions"}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
