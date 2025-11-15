import { MovieFullITF } from "@/lib/interface/movieInterface";
import Image from "next/image";
import WatchTrailer from "../Button/WatchTrailer";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faClock,
  faComment,
  faEarth,
  faTag,
  faUserCheck,
} from "@fortawesome/free-solid-svg-icons";
import styles from "./MovieDetail.module.scss";
import { formatDateWithDay } from "@/lib/function";
import LoadingPage from "../LoadingPage/LoadingPage";

function MovieDetail({ data }: { data: MovieFullITF[] }) {
  if (!data || data.length === 0) {
    console.log("errrrr");
    return (
      <div>
        <LoadingPage />
      </div>
    );
  }
  return (
    <div>
      {/* chi tiết phim */}
      <div className="flex">
        <div className="flex-4 px-2 ">
          <div className="relative ">
            <Image
              src={data[0].image}
              width={120}
              height={50}
              alt="poster"
              className="h-full w-full rounded-sm border border-gray-400 "
            />
            <div
              className="absolute top-0 left-0 text-xl font-bold px-2 py-1 bg-red-500
            rounded-tl-sm"
            >
              T{data[0].age_require}
            </div>
          </div>
        </div>
        <div className="flex-6 px-2">
          <h1 className="uppercase text-4xl font-bold py-1 mb-4">
            {data[0].name} (T{data[0].age_require})
          </h1>
          <div>
            <div className={`${styles.info_Item}`}>
              <div>
                <FontAwesomeIcon icon={faTag} />
              </div>
              <span>
                {data[0].genres.map((genre, i) => (
                  <span key={i}>
                    {genre}
                    {i < data[0].genres.length - 1 && ", "}
                  </span>
                ))}
              </span>
            </div>
            <div className={`${styles.info_Item}`}>
              <div>
                <FontAwesomeIcon icon={faClock} />
              </div>
              <span>{data[0].duration} phút</span>
            </div>
            <div className={`${styles.info_Item}`}>
              <div>
                <FontAwesomeIcon icon={faEarth} />
              </div>
              <span>{data[0].country}</span>
            </div>
            <div className={`${styles.info_Item}`}>
              <div>
                <FontAwesomeIcon icon={faComment} />
              </div>
              <span>{data[0].subtitle}</span>
            </div>
            <div className={`${styles.info_Item}`}>
              <div>
                <FontAwesomeIcon icon={faUserCheck} />
              </div>
              <span className="bg-(--color-yellow) text-black">
                T{data[0].age_require}: Phim dành cho khán giả từ đủ{" "}
                {data[0].age_require} tuổi trở lên ({data[0].age_require}+)
              </span>
            </div>
          </div>
          <h3 className={`${styles.sub_title}`}>MÔ TẢ</h3>
          <div>
            <div>
              Diễn viên:{" "}
              {data[0].actors.map((actor, i) => (
                <span key={i}>
                  {actor}
                  {i < data[0].actors.length - 1 ? ", " : ", ..."}
                </span>
              ))}
            </div>
            <div>Khởi chiếu: {formatDateWithDay(data[0].release_date)}</div>
          </div>
          <h3 className={`${styles.sub_title}`}>NỘI DUNG</h3>
          <div>{data[0].description}</div>
          <div className="my-2">
            <WatchTrailer size="m" />
          </div>
        </div>
      </div>
      <div></div>
    </div>
  );
}

export default MovieDetail;
