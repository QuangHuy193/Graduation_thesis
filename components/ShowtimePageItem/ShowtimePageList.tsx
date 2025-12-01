"use client";

import {
  faClock,
  faComment,
  faEarth,
  faTag,
  faUserCheck,
  faVideoSlash,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Image from "next/image";
import styles from "./ShowtimePageList.module.scss";
import LoadingLink from "../Link/LinkLoading";
import { toMySQLDate } from "@/lib/function";

function ShowtimePageList({ data, size }: { size: string }) {
  const handleSetQuickTicket = (movie_id, date, times) => {
    const quickTicket = {
      movie_id: movie_id,
      date: date,
      times: times,
    };
    sessionStorage.setItem("quickticket", JSON.stringify(quickTicket));
  };
  return (
    <div className="py-4">
      {data.length > 0 ? (
        data.map((m) => (
          <div
            key={m.movie_id}
            className={`flex gap-4 border-b border-b-gray-400 py-6`}
          >
            <div className={`basis-4/12`}>
              <div>
                <Image
                  className={`w-full`}
                  src={m.image}
                  alt="Poster"
                  width={120}
                  height={50}
                />
              </div>
              <div>
                <h1 className="uppercase text-xl font-bold py-1 mb-4">
                  {m.name} (T{m.age_require})
                </h1>
                <div className={`${styles.info_Item}`}>
                  <div>
                    <FontAwesomeIcon icon={faTag} />
                  </div>
                  <span>
                    {m.genres.map((genre, i) => (
                      <span key={i}>
                        {genre}
                        {i < m.genres.length - 1 && `, `}
                      </span>
                    ))}
                  </span>
                </div>
                <div className={`${styles.info_Item}`}>
                  <div>
                    <FontAwesomeIcon icon={faClock} />
                  </div>
                  <span>{m.duration} phút</span>
                </div>
                <div className={`${styles.info_Item}`}>
                  <div>
                    <FontAwesomeIcon icon={faEarth} />
                  </div>
                  <span>{m.country}</span>
                </div>
                <div className={`${styles.info_Item}`}>
                  <div>
                    <FontAwesomeIcon icon={faComment} />
                  </div>
                  <span>{m.subtitle}</span>
                </div>
                <div className={`${styles.info_Item}`}>
                  <div>
                    <FontAwesomeIcon icon={faUserCheck} />
                  </div>
                  <span>
                    T{m.age_require}: Phim dành cho khán giả từ đủ{" "}
                    {m.age_require} tuổi trở lên ({m.age_require}+)
                  </span>
                </div>
              </div>
            </div>
            <div className={`basis-8/12`}>
              {m.dates.length > 0 &&
                m.dates.map((d, i) => (
                  <div key={i}>
                    {d.cinemas.length > 0 &&
                      d.cinemas.map((c, ind) => (
                        <div
                          key={ind}
                          className={`flex gap-3 pb-5 border-b border-gray-400`}
                        >
                          <div className={`basis-5/12`}>
                            <h1 className={`text-3xl font-bold pb-3`}>
                              {c.name}
                            </h1>
                            <div className={`italic`}>{c.address}</div>
                          </div>
                          <div className={`flex basis-7/12 gap-5`}>
                            {c.showtimes.length > 0 &&
                              c.showtimes.map((s) => (
                                <div key={s.showtime_id}>
                                  <button
                                    className={`text-white border hover:border-(--color-yellow) 
                                      hover:text-(--color-yellow) rounded-sm px-2 py-1 cursor-pointer`}
                                    onClick={() =>
                                      handleSetQuickTicket(
                                        m.movie_id,
                                        toMySQLDate(d.date),
                                        s.movie_screen_id
                                      )
                                    }
                                  >
                                    <LoadingLink href={`/movie/${m.movie_id}`}>
                                      {s.start_time}
                                    </LoadingLink>
                                  </button>
                                </div>
                              ))}
                          </div>
                        </div>
                      ))}
                  </div>
                ))}
            </div>
          </div>
        ))
      ) : (
        <div
          className="flex justify-center items-center text-4xl text-(--color-yellow) 
                py-10 gap-3"
        >
          <FontAwesomeIcon icon={faVideoSlash} />
          <span>HIỆN CHƯA CÓ LỊCH CHIẾU</span>
        </div>
      )}
    </div>
  );
}

export default ShowtimePageList;
