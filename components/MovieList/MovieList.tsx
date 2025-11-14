import { MovieItemITF } from "@/lib/interface/movieInterface";
import MovieItem from "../MovieItem/MovieItem";
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronLeft,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";
import Button from "../Button/Button";

function MovieList({
  data,
  title,
  link = "",
}: {
  data: MovieItemITF[];
  title: string;
  link: string;
}) {
  const [page, setPage] = useState(0);
  const pageSize = 4;

  // Số trang tối đa
  const totalPages = Math.max(1, Math.ceil(data.length / pageSize));

  const nextPage = () => {
    if (page < totalPages - 1) setPage((p) => p + 1);
  };

  const prevPage = () => {
    if (page > 0) setPage((p) => p - 1);
  };

  return (
    <div>
      <div className="w-full flex justify-center py-7 text-4xl font-bold">
        {title}
      </div>

      <div className="relative">
        <button
          onClick={prevPage}
          disabled={page === 0}
          className={`btn_move_slider left}`}
        >
          <FontAwesomeIcon icon={faChevronLeft} />
        </button>

        {/* VIEWPORT - ẩn overflow, giữ kích thước */}
        <div className={`sliderViewport`}>
          {/* TRACK - sẽ dịch chuyển bằng transform */}
          <div
            className={`sliderTrack`}
            style={{ transform: `translateX(-${page * 100}%)` }}
          >
            {/* Mỗi slide chứa 4 item (grid) */}
            {Array.from({ length: totalPages }).map((_, p) => {
              const start = p * pageSize;
              const slice = data.slice(start, start + pageSize);
              return (
                <div className={`slide`} key={p}>
                  {/* slideInner giữ padding/gutter - không làm slide vượt 100% */}
                  <div className={`slideInner`}>
                    <div className="grid grid-cols-4 gap-6">
                      {slice.map((movie) => (
                        <div key={movie.movie_id}>
                          <MovieItem data={movie} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Nút phải */}
        <button
          onClick={nextPage}
          disabled={page >= totalPages - 1}
          className={`btn_move_slider right`}
        >
          <FontAwesomeIcon icon={faChevronRight} />
        </button>
      </div>

      {/* Dots */}
      <div className="w-full flex justify-center p-2 gap-2">
        {Array.from({ length: totalPages }).map((_, i) => (
          <button
            key={i}
            onClick={() => setPage(i)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              i === page
                ? "bg-white scale-110"
                : "bg-gray-400 hover:bg-gray-500"
            } cursor-pointer`}
            aria-label={`Trang ${i + 1}`}
          />
        ))}
      </div>

      <div className="w-full flex justify-center pt-3 pb-5">
        <Button
          text="XEM THÊM"
          bg_color="transparent"
          text_color="--color-yellow"
          border="var(--color-yellow) 1px solid"
          p_l_r="80px"
          text_size="15px"
          hover_text_color="--color-white"
          hover_bg_color="#FF9933"
          link={link}
        />
      </div>
    </div>
  );
}

export default MovieList;
