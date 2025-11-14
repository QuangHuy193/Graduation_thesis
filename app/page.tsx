"use client";
import BarTicket from "@/components/BarTicket/BarTicket";
import MovieList from "@/components/MovieList/MovieList";
import PromotionList from "@/components/PromotionList/PromotionList";
import { getMovieShowingBanerAPI } from "@/lib/axios/movieAPI";
import { useEffect, useState } from "react";

const dataF2 = ["/HSSV-2.webp", "/HSSV-2.webp", "/HSSV-2.webp", "/HSSV-2.webp"];

export default function Home() {
  const [bannerMovieShowng, setBannerMovieShowng] = useState([]);

  useEffect(() => {
    const getMovieShowingBaner = async () => {
      try {
        const res = await getMovieShowingBanerAPI();
        setBannerMovieShowng(res);
        //console.log(res);
      } catch (error) {
        console.log(error);
      }
    };

    getMovieShowingBaner();
  }, []);

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

          {/* <div className="pb-[50px]">
            <MovieList
              data={bannerMovieShowng}
              title="PHIM SẮP CHIẾU"
              link="/movie/upcoming"
            />
          </div> */}

          <div className="pb-[50px]">
            <PromotionList
              data={dataF2}
              title="KHUYẾN MÃI"
              link={"/promotions"}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
