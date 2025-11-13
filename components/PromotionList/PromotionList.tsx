import { useState } from "react";
import PromotionItem from "../PromotionItem/PromotionItem";
import Button from "../Button/Button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronLeft,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";

function PromotionList({
  data,
  title,
  link = "",
}: {
  data: string[];
  title: string;
  link: string;
}) {
  const [page, setPage] = useState(0);
  const pageSize = 3;

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
      <div className="w-full flex justify-start py-7 text-4xl font-bold">
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
            {/* Mỗi slide chứa 3 item (grid) */}
            {Array.from({ length: totalPages }).map((_, p) => {
              const start = p * pageSize;
              const slice = data.slice(start, start + pageSize);
              return (
                <div className={`slide`} key={p}>
                  {/* slideInner giữ padding/gutter - không làm slide vượt 100% */}
                  <div className={`slideInner`}>
                    <div className="grid grid-cols-3 gap-6">
                      {slice.map((img, index) => (
                        <div key={index}>
                          <PromotionItem image={img} link={link} />
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
        <Button text="XEM THÊM" p_l_r="80px" link={link} text_size="15px" />
      </div>
    </div>
  );
}

export default PromotionList;
