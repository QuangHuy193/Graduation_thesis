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
import { scrollToPosition } from "@/lib/function";
import { faAngleUp } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useState } from "react";

export default function Home() {
  const [bannerMovieShowng, setBannerMovieShowng] = useState([]);
  const [bannerMovieUpcoming, setBannerMovieUpcoming] = useState([]);
  const [promotionList, setPromotionList] = useState([]);
  const [loading, setLoading] = useState(true);

  const [show, setShow] = useState(false);

  // useEffect(() => {
  //   const handleScroll = () => {
  //     setShow(window.scrollY > 0);
  //   };

  //   window.addEventListener("scroll", handleScroll);
  //   return () => window.removeEventListener("scroll", handleScroll);
  // }, []);
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setShow(window.scrollY > 100);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // useEffect(() => {
  //   const getMovieShowingBaner = async () => {
  //     try {
  //       const res = await getMovieShowingBanerAPI();
  //       setBannerMovieShowng(res);
  //     } catch (error) {
  //       console.log(error);
  //     }
  //   };

  //   const getMovieUpcomingBanner = async () => {
  //     try {
  //       const res = await getMovieUpcommingBanerAPI();
  //       setBannerMovieUpcoming(res);
  //     } catch (error) {
  //       console.log(error);
  //     }
  //   };

  //   const getPromotionList = async () => {
  //     try {
  //       const res = await getPromotionsAPI();
  //       setPromotionList(res);
  //     } catch (error) {
  //       console.log(error);
  //     }
  //   };

  //   getMovieShowingBaner();
  //   getMovieUpcomingBanner();
  //   getPromotionList();
  // }, []);
  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        setLoading(true);
        const [showing, upcoming, promotions] = await Promise.all([
          getMovieShowingBanerAPI(),
          getMovieUpcommingBanerAPI(),
          getPromotionsAPI(),
        ]);

        setBannerMovieShowng(showing);
        setBannerMovieUpcoming(upcoming);
        setPromotionList(promotions);
      } catch (error) {
        console.error("Home fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHomeData();
  }, []);

  if (loading) {
    return <LoadingPage />;
  }

  return (
    <div>
      <div>
        <BarTicket />
      </div>

      <div>
        <div className="pb-[20px] md:pb-[50px]">
          <MovieList
            data={bannerMovieShowng}
            title="PHIM ĐANG CHIẾU"
            link="/movie/showing"
          />
        </div>

        <div className="pb-[20px] md:pb-[50px]">
          <MovieList
            data={bannerMovieUpcoming}
            title="PHIM SẮP CHIẾU"
            link="/movie/upcoming"
          />
        </div>

        <div className="pb-[20px] md:pb-[50px]">
          <PromotionList
            data={promotionList}
            title="KHUYẾN MÃI"
            link={"/promotions"}
          />
        </div>

        {show && (
          <div
            onClick={() => scrollToPosition()}
            className="fixed right-7 bottom-10 w-10 h-10 flex items-center 
        justify-center rounded-full bg-white cursor-pointer hover:bg-(--color-purple)
        group"
          >
            <FontAwesomeIcon
              className="text-black group-hover:text-white"
              icon={faAngleUp}
            />
          </div>
        )}
      </div>
    </div>
  );
}
