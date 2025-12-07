"use client";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Image from "next/image";
import styles from "./MovieListInCinema.module.scss";
import {
  faClock,
  faComment,
  faEarth,
  faTag,
  faUserCheck,
} from "@fortawesome/free-solid-svg-icons";
import { formatDateWithDay } from "@/lib/function";
import LoadingLink from "../Link/LinkLoading";
import { useRouter } from "next/navigation";

function MovieListInCinema({ data, text }) {
  const router = useRouter();

  // set giá trị đặt vé nhanh cho movieDetail đọc
  const handleSetQuickTicket = (
    movie_id: number,
    date: Date,
    times: number
  ) => {
    const quickTicket = {
      // number
      movie_id: movie_id,
      // date
      date: date,
      // number
      times: times,
    };
    sessionStorage.setItem("quickticket", JSON.stringify(quickTicket));
    router.push(`/movie/${movie_id}`);
  };

  return (
    <div>
      <h1 className="font-bold text-4xl flex justify-center items-center pt-10 pb-5">
        {text}
      </h1>
      <div className="grid grid-cols-2 gap-2">
        {data?.length > 0 &&
          data.map((d) => (
            <div key={d.movie_id} className="flex">
              <div className="flex-1">
                <Image
                  src={d.image}
                  alt="poster"
                  width={120}
                  height={50}
                  className="w-full rounded-[10px]"
                />
              </div>
              <div className="flex-1 px-2">
                <h2 className="uppercase text-2xl font-bold py-1 mb-2">
                  {d.name} (T{d.age_require})
                </h2>
                <div className="flex flex-wrap space-x-2 ">
                  <div className={`${styles.info_Item}`}>
                    <div>
                      <FontAwesomeIcon icon={faTag} />
                    </div>
                    <span>
                      {d.genres.map((genre, i) => (
                        <span key={i}>
                          {genre}
                          {i < d.genres.length - 1 && `, `}
                        </span>
                      ))}
                    </span>
                  </div>
                  <div className={`${styles.info_Item}`}>
                    <div>
                      <FontAwesomeIcon icon={faClock} />
                    </div>
                    <span>{d.duration}</span>
                  </div>
                  <div className={`${styles.info_Item}`}>
                    <div>
                      <FontAwesomeIcon icon={faEarth} />
                    </div>
                    <span>{d.country}</span>
                  </div>
                  <div className={`${styles.info_Item}`}>
                    <div>
                      <FontAwesomeIcon icon={faComment} />
                    </div>
                    <span>{d.subtitle}</span>
                  </div>
                </div>
                <div className={`${styles.info_Item}`}>
                  <div>
                    <FontAwesomeIcon icon={faUserCheck} />
                  </div>
                  <span>
                    T{d.age_require}: Phim dành cho khán giả từ đủ{" "}
                    {d.age_require} tuổi trở lên ({d.age_require}+)
                  </span>
                </div>
                <div className="py-2">
                  {d.dates?.length > 0 ? (
                    d.dates.map((date) => (
                      <div
                        key={date.date}
                        className="border border-gray-400 rounded-xl p-2 mt-3"
                      >
                        <div className="font-semibold pb-3">
                          {formatDateWithDay(date.date)}
                        </div>
                        <div className="flex gap-2">
                          {date.showtimes?.length > 0 &&
                            date.showtimes.map((s, ind) => (
                              <div
                                // TODO thêm tương tự đặt vé nhanh
                                onClick={() =>
                                  handleSetQuickTicket(
                                    d.movie_id,
                                    date.date,
                                    s.movie_screen_id
                                  )
                                }
                                key={ind}
                                className="border border-gray-400 rounded-sm px-2 py-1
                                  hover:text-(--color-yellow) hover:border-(--color-yellow)
                                  cursor-pointer"
                              >
                                {s.start_time}
                              </div>
                            ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div>Chưa có lịch chiếu</div>
                  )}
                </div>
                <div className="underline text-(--color-yellow) cursor-pointer mb-3">
                  <LoadingLink href={`/movie/${d.movie_id}`}>
                    Xem thêm lịch chiếu
                  </LoadingLink>
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}

export default MovieListInCinema;
