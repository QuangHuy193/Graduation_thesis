"use client";
import MovieList from "@/components/MovieList/MovieList";
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
];
export default function Home() {
  return (
    <div>
      <div className="px-10 bg-[linear-gradient(180deg,var(--color-blue-black)_0%,#2b3b5e_100%)] ">
        <div className="h-(--width-header)"></div>
        <div>
          <MovieList data={dataF} title="PHIM ĐANG CHIẾU" />
        </div>
      </div>
    </div>
  );
}
