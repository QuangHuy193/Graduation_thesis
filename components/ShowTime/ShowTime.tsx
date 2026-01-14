"use client";
import { getCityAPI } from "@/lib/axios/cinemasAPI";
import { weekdays } from "@/lib/constant";
import { faVideoSlash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useState } from "react";
import styles from "./ShowTime.module.scss";
import ShowTimeCard from "../ShowTimeCard/ShowTimeCard";
import Spinner from "../Spinner/Spinner";
import { getShowtimeByDateAPI } from "@/lib/axios/showTimeAPI";
import { getTicketTypeByShowtimeDateAPI } from "@/lib/axios/ticketTypeAPI";
import { getDayOffset } from "@/lib/function";

function ShowTime({
  movie_id,
  unlockseats,
  setTimesSelect,
  timeSelected,
  setTicketTypes,
  setDateSelected,
  isFetch,
}: {
  movie_id: number;
  setTimesSelect: (obj: {
    showtime_id: number;
    room_id: number;
    cinema_name: string;
    cinema_address: string;
    room_name: string;
    time: string;
  }) => void;
  timeSelected: object;
  setDateSelected: (date: number) => void;
  isFetch: (flag: boolean) => void;
}) {
  const days = Array.from({ length: 5 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });

  const [showTimes, setShowtimes] = useState({
    dataApi: {},
  });
  const [selected, setSelected] = useState({
    dateSelected: 0,
  });

  const [toggle, setToggle] = useState({
    fetchData: false,
  });

  //  đặt vé  nhanh
  useEffect(() => {
    const dataSession = sessionStorage.getItem("quickticket");
    if (dataSession) {
      const data = JSON.parse(dataSession);
      setSelected((prev) => ({
        ...prev,
        dateSelected: getDayOffset(data.date),
      }));
    }
  }, []);

  useEffect(() => {
    setDateSelected(selected.dateSelected);
  }, [selected.dateSelected]);

  // đổi ngày
  useEffect(() => {
    // xóa giờ, loại vé đã chọn gây lỗi khi đặt vé nhanh - đã test lại k có lỗi
    setTimesSelect({
      showtime_id: -1,
      room_id: -1,
      cinema_name: "",
      cinema_address: "",
      room_name: "",
      time: "",
    });
    // gọi api lấy showtime
    const getShowtime = async (day: number) => {
      setToggle((prev) => ({ ...prev, fetchData: true }));
      try {
        const res = await getShowtimeByDateAPI(day, movie_id);

        await setShowtimes((prev) => ({
          ...prev,
          dataApi: {
            ...prev.dataApi,
            [day]: {
              data: res,
            },
          },
        }));
        setToggle((prev) => ({ ...prev, fetchData: false }));
      } catch (error) {
        console.log(error);
        setToggle((prev) => ({ ...prev, fetchData: false }));
      }
    };

    const day = selected.dateSelected ? selected.dateSelected : 0;
    getShowtime(day);
  }, [selected.dateSelected]);

  useEffect(() => {
    // gọi api lấy ds loại vé và giá theo showtime và ngày
    const getTicketType = async (showtime_id: number) => {
      isFetch(true);
      try {
        const res = await getTicketTypeByShowtimeDateAPI(showtime_id);

        setTicketTypes(res);
      } catch (error) {
        console.log(error);
      } finally {
        isFetch(false);
      }
    };

    if (timeSelected?.showtime_id !== -1) {
      getTicketType(timeSelected?.showtime_id);
    }
  }, [selected.dateSelected, timeSelected]);

  return (
    <div className="px-0 md:px-25 lg:px-35">
      <div className="text-2xl md:text-4xl font-bold justify-center flex mb-4 md:mb-6 mt-6">
        LỊCH CHIẾU
      </div>
      <div className="flex gap-5 justify-center mb-6">
        {days.map((day, idx) => (
          <div
            onClick={() =>
              setSelected((prev) => ({ ...prev, dateSelected: idx }))
            }
            key={idx}
            className={`h-20 w-24 border border-(--color-yellow) rounded-sm flex flex-col 
            items-center justify-center cursor-pointer ${
              selected.dateSelected === idx ? styles.date_selected : ""
            }`}
          >
            <span className="text-lg font-semibold">
              {day.getDate()}/{day.getMonth() + 1}
            </span>
            <span className="text-sm">{weekdays[day.getDay()]}</span>
          </div>
        ))}
      </div>

      <div className="flex justify-between mb-4 items-center">
        <div className="text-lg md:text-2xl lg:text-4xl font-bold">
          DANH SÁCH RẠP
        </div>
      </div>

      <div className="pb-4">
        {toggle.fetchData ? (
          <div>
            <Spinner />
          </div>
        ) : (
          <div>
            {showTimes.dataApi[selected.dateSelected]?.data?.length > 0 ? (
              showTimes.dataApi[selected.dateSelected]?.data?.map(
                (d, i: number) => (
                  <div key={i} className="pb-3">
                    <ShowTimeCard
                      data={d}
                      setTimesSelect={setTimesSelect}
                      timeSelected={timeSelected}
                      unlockseats={unlockseats}
                    />
                  </div>
                )
              )
            ) : (
              <div
                className="flex justify-center items-center text-xl md:text-4xl text-(--color-yellow) 
                py-10 gap-2 md:gap-3 text-center uppercase"
              >
                <span>
                  <div>
                    <FontAwesomeIcon icon={faVideoSlash} /> HIỆN CHƯA CÓ LỊCH
                    CHIẾU
                  </div>
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ShowTime;
