"use client";
import MovieList from "@/components/MovieList/MovieList";
import PromotionList from "@/components/PromotionList/PromotionList";
const dataF = [
  {
    id: 1,
    image: "/trai-tim-que-quat-poster.webp",
    name: "Trái tim què quặt Phần 22222",
    age: 16,
    contruy: "Việt Nam",
    subtitle: "Tiếng Việt",
    duration: 120,
    genre: ["Hồi hộp", "Tâm lý"],
  },
  {
    id: 2,
    image: "/trai-tim-que-quat-poster.webp",
    name: "Trái tim què quặt",
    age: 16,
    contruy: "Việt Nam",
    subtitle: "Tiếng Việt",
    duration: 120,
    genre: ["Hồi hộp", "Tâm lý"],
  },
  {
    id: 3,
    image: "/trai-tim-que-quat-poster.webp",
    name: "Trái tim què quặt",
    age: 16,
    contruy: "Việt Nam",
    subtitle: "Tiếng Việt",
    duration: 120,
    genre: ["Hồi hộp", "Tâm lý"],
  },
  {
    id: 4,
    image: "/trai-tim-que-quat-poster.webp",
    name: "Trái tim què quặt",
    age: 16,
    contruy: "Việt Nam",
    subtitle: "Tiếng Việt",
    duration: 120,
    genre: ["Hồi hộp", "Tâm lý"],
  },
  {
    id: 5,
    image: "/trai-tim-que-quat-poster.webp",
    name: "Trái tim què quặt",
    age: 16,
    contruy: "Việt Nam",
    subtitle: "Tiếng Việt",
    duration: 120,
    genre: ["Hồi hộp", "Tâm lý"],
  },
];

const dataF2 = ["/HSSV-2.webp", "/HSSV-2.webp", "/HSSV-2.webp", "/HSSV-2.webp"];
export default function Home() {
  return (
    <div>
      <div className="px-10 bg ">
        <div className="h-(--width-header)"></div>
        <div>
          <div className="pb-[50px]">
            <MovieList
              data={dataF}
              title="PHIM ĐANG CHIẾU"
              link="/movie/showing"
            />
          </div>

          <div className="pb-[50px]">
            <MovieList
              data={dataF}
              title="PHIM SẮP CHIẾU"
              link="/movie/upcoming"
            />
          </div>

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
