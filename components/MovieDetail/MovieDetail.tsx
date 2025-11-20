"use client";
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
import { formatDateWithDay, scrollToPosition } from "@/lib/function";
import LoadingPage from "../LoadingPage/LoadingPage";
import { useEffect, useState } from "react";
import VideoTrailer from "../VideoTrailer/VideoTrailer";
import ShowTime from "../ShowTime/ShowTime";
import { dataTicketFake } from "@/lib/constant";
import PriceCard from "../PriceCard/PriceCard";
import Room from "../Room/Room";
import { getRoomAsileWithIdAPI } from "@/lib/axios/roomAPI";
import { getSeatsWithRoomShowtimeAPI } from "@/lib/axios/seatsAPI";

function MovieDetail({
  data,
  movie_id,
}: {
  data: MovieFullITF[];
  movie_id: number;
}) {
  const [state, setState] = useState({
    watchTrailer: false,
    timesSelected: { showtime_id: -1, room_id: -1 },
    ticketSelected: {},
    room_asile: {},
    seats: [],
    seatSelected: [],
  });
  const handleSelectSeat = (seat_id: number) => {
    const { ticketSelected, seatSelected } = state;

    // tổng số vé đã chọn
    const totalTickets = Object.values(ticketSelected).reduce(
      (acc, val) => acc + val,
      0
    );

    // tổng số ghế đã chọn
    const totalSeats = seatSelected.length;

    // kiểm tra nếu ghế đã chọn thì bỏ chọn
    const existing = seatSelected.find((s) => s.seat_id === seat_id);
    if (existing) {
      setState((prev) => ({
        ...prev,
        seatSelected: prev.seatSelected.filter((s) => s.seat_id !== seat_id),
      }));
      return;
    }

    // nếu chưa đủ số ghế → chọn tiếp
    if (totalSeats < totalTickets) {
      // tự động phân loại theo thứ tự loại vé
      let typeToUse = "";
      const countByType = seatSelected.reduce((acc, s) => {
        acc[s.type] = (acc[s.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      for (const type in ticketSelected) {
        if ((countByType[type] || 0) < ticketSelected[type]) {
          typeToUse = type;
          break;
        }
      }

      setState((prev) => ({
        ...prev,
        seatSelected: [...prev.seatSelected, { seat_id, type: typeToUse }],
      }));
    } else {
      // đủ ghế rồi → không chọn thêm
      console.log("Đã chọn đủ ghế rồi!");
    }
  };

  useEffect(() => {
    if (
      state.timesSelected.room_id === -1 ||
      state.timesSelected.showtime_id === -1
    ) {
      return;
    }
    scrollToPosition(0, true, "select_ticket_type", 120);

    const getRoomAsile = async (room_id: number) => {
      try {
        const res = await getRoomAsileWithIdAPI(room_id);
        setState((prev) => ({ ...prev, room_asile: res }));
      } catch (error) {
        console.log(error);
      }
    };

    const getSeats = async (room: number, showtime: number) => {
      try {
        const res = await getSeatsWithRoomShowtimeAPI(room, showtime);
        setState((prev) => ({ ...prev, seats: res }));
      } catch (error) {
        console.log(error);
      }
    };

    if (
      state.timesSelected.room_id !== -1 &&
      state.timesSelected.showtime_id !== -1
    ) {
      getRoomAsile(state.timesSelected.room_id);
      getSeats(state.timesSelected.room_id, state.timesSelected.showtime_id);
    }
  }, [state.timesSelected]);

  useEffect(() => {
    scrollToPosition(0, true, "select_seat", 100, 2000);
  }, [state.ticketSelected]);

  if (!data || data.length === 0) {
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
          <div className="relative h-[550px]">
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
          <div
            className="my-2 w-fit"
            onClick={() =>
              setState((prev) => ({ ...prev, watchTrailer: true }))
            }
          >
            <WatchTrailer size="m" />
          </div>
          {state.watchTrailer && (
            <VideoTrailer
              onClose={() => setState({ watchTrailer: false })}
              src={data[0].trailer_url}
            />
          )}
        </div>
      </div>

      <div>
        <ShowTime
          movie_id={movie_id}
          setTimesSelect={(obj) =>
            setState((prev) => ({
              ...prev,
              timesSelected: obj,
            }))
          }
          timeSelected={state}
        />
      </div>

      {state.timesSelected.showtime_id !== -1 && (
        <div id="select_ticket_type" className="mt-16">
          <div className="flex justify-center text-4xl font-bold mb-16">
            CHỌN LOẠI VÉ
          </div>
          <div className="flex gap-6 justify-center">
            {dataTicketFake.map((t, i) => (
              <div key={i} className="h-[150px] w-[300px]">
                <PriceCard
                  data={t}
                  setTicketSelected={(name, inc) => {
                    setState((prev) => {
                      const oldValue = prev.ticketSelected?.[name] ?? 0;
                      let newValue;
                      if (inc) {
                        newValue = oldValue + 1;
                      } else {
                        if (oldValue === 0) {
                          newValue = 0;
                        } else {
                          newValue = oldValue - 1;
                        }
                      }

                      return {
                        ...prev,
                        ticketSelected: {
                          ...prev.ticketSelected,
                          [name]: newValue,
                        },
                      };
                    });
                  }}
                  ticketSelected={state.ticketSelected}
                />
              </div>
            ))}
          </div>

          <div id="select_seat" className="py-4">
            <Room
              data={state.room_asile}
              seats={state.seats}
              selectSeat={(seat_id) => {
                handleSelectSeat(seat_id);
              }}
              seatSelected={state.seatSelected}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default MovieDetail;
