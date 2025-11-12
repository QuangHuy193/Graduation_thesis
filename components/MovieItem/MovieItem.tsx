import { MovieItemITF } from "@/lib/interface/movieInterface";
import Image from "next/image";
import WatchTrailer from "../Button/WatchTrailer";
import Button from "../Button/Button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faClock,
  faComment,
  faEarth,
  faTag,
} from "@fortawesome/free-solid-svg-icons";
import styles from "./MovieItem.module.scss";
import Link from "next/link";

function MovieItem({ data }: { data: MovieItemITF }) {
  return (
    <div className="h-full relative">
      <div className="relative group">
        <Image
          src={data.image}
          width={250}
          height={50}
          alt={data.name}
          className="w-full cursor-pointer"
        />

        <div
          className="absolute top-0 left-0 text-xl font-bold px-2 py-1 bg-red-500
        group-hover:opacity-0 transition-opacity duration-300 ease-in-out"
        >
          T{data.age}
        </div>

        <Link href={`/movie/${data.id}`}>
          <div
            className="cursor-pointer absolute top-0 left-0 right-0 bottom-0 flex 
          items-center justify-center bg-linear-to-t from-black
           via-black/40 to-transparent opacity-0 group-hover:opacity-100 
           transition-opacity duration-500 ease-in-out"
          >
            <div className="flex flex-col px-5 ">
              <div className="uppercase font-bold text-[18px] pb-4">
                {data.name} (T{data.age})
              </div>
              <div>
                <FontAwesomeIcon
                  icon={faTag}
                  className={`${styles.icon_item}`}
                />
                <span className={`${styles.text_item}`}>
                  {data.genre.map((g, i) => (
                    <span key={i}>
                      {g}
                      {i < data.genre.length - 1 && " , "}
                    </span>
                  ))}
                </span>
              </div>
              <div>
                <FontAwesomeIcon
                  icon={faClock}
                  className={`${styles.icon_item}`}
                />
                <span className={`${styles.text_item}`}>
                  {data.duration} phút
                </span>
              </div>
              <div>
                <FontAwesomeIcon
                  icon={faEarth}
                  className={`${styles.icon_item}`}
                />
                <span className={`${styles.text_item}`}>{data.contruy}</span>
              </div>
              <div>
                <FontAwesomeIcon
                  icon={faComment}
                  className={`${styles.icon_item}`}
                />
                <span className={`${styles.text_item}`}>{data.subtitle}</span>
              </div>
            </div>
          </div>
        </Link>
      </div>
      <div
        className="uppercase hover:text-(--color-yellow) font-bold flex justify-center
        cursor-pointer pt-5 pb-18 text-xl text-center min-h-[90px]"
      >
        <Link href={`/movie/${data.id}`}>
          {data.name} (T{data.age})
        </Link>
      </div>
      <div className="flex gap-2 pb-5 absolute left-0 right-0 bottom-0">
        <div className="flex-1">
          <WatchTrailer size="s" />
        </div>
        <div className="flex-1">
          <Button text="ĐẶT VÉ" wfull={true} />
        </div>
      </div>
    </div>
  );
}

export default MovieItem;
