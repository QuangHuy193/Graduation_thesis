"use client";
import { getCityAPI } from "@/lib/axios/cinemasAPI";
import { weekdays } from "@/lib/constant";
import { faLocationDot, faVideoSlash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Select } from "antd";
import { useEffect, useState } from "react";
import styles from "./ShowTime.module.scss";
import ShowTimeCard from "../ShowTimeCard/ShowTimeCard";
import Spinner from "../Spinner/Spinner";
import { getShowtimeByDateAPI } from "@/lib/axios/showTimeAPI";

function ShowTime({
  movie_id,
  setTimesSelect,
  timeSelected,
}: {
  movie_id: number;
  setTimesSelect: (obj: {
    showtime_id: number;
    room_id: number;
    cinema_name: string;
    room_name: string;
    time: string;
  }) => void;
  timeSelected: object;
}) {
  const days = Array.from({ length: 5 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });

  const [citys, setCitys] = useState([]);
  const [showTimes, setShowtimes] = useState({
    dataApi: {},
    dataDisplay: {},
  });
  const [selected, setSelected] = useState({
    provinceSelected: "",
    dateSelected: 0,
  });
  const [toggle, setToggle] = useState({
    fetchData: false,
  });

  useEffect(() => {
    const getCitys = async () => {
      try {
        const res = await getCityAPI();
        setCitys(res);
        setSelected((prev) => ({
          ...prev,
          provinceSelected: "TP. Hồ Chí Minh",
        }));
      } catch (error) {
        console.log(error);
      }
    };
    getCitys();
  }, []);

  useEffect(() => {
    // xóa giờ, loại vé đã chọn
    setTimesSelect({
      showtime_id: -1,
      room_id: -1,
      cinema_name: "",
      room_name: "",
      time: "",
    });
    const getShowtime = async (day: number) => {
      setToggle((prev) => ({ ...prev, fetchData: true }));
      try {
        const res = await getShowtimeByDateAPI(day, movie_id);

        const filtered = filterByProvince(res, selected.provinceSelected);
        await setShowtimes((prev) => ({
          ...prev,
          dataDisplay: {
            ...prev.dataDisplay,
            [day]: {
              data: res,
            },
          },
          dataApi: {
            ...prev.dataApi,
            [day]: {
              data: filtered,
            },
          },
        }));
        setToggle((prev) => ({ ...prev, fetchData: false }));
      } catch (error) {
        console.log(error);
        setToggle((prev) => ({ ...prev, fetchData: false }));
      }
    };

    const filterByProvince = (data: any[], province: string) => {
      if (!province) return data;

      return data.filter((item) => item.province === province);
    };

    const day = selected.dateSelected ? selected.dateSelected : 0;
    if (!showTimes.dataApi[day]) {
      getShowtime(day);
    } else {
      const raw = showTimes.dataApi[day].data;
      const filtered = filterByProvince(raw, selected.provinceSelected);

      setShowtimes((prev) => ({
        ...prev,
        dataDisplay: {
          ...prev.dataDisplay,
          [day]: { data: filtered },
        },
      }));
    }
  }, [selected.dateSelected, selected.provinceSelected]);

  return (
    <div className="px-35">
      <div className="text-4xl font-bold justify-center flex mb-6">
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

      <div className="flex justify-between mb-4">
        <div className="text-4xl font-bold">DANH SÁCH RẠP</div>
        <Select
          onChange={(value) => {
            setSelected((prev) => ({ ...prev, provinceSelected: value }));
          }}
          notFoundContent={"Đang tải dữ liệu..."}
          className={`${styles.select} w-[180px]`}
          value={selected.provinceSelected}
          options={
            citys?.length
              ? citys.map((city) => ({
                  label: (
                    <div className="flex items-center gap-2">
                      <span>{city.province}</span>
                    </div>
                  ),
                  value: city.province,
                }))
              : []
          }
          labelRender={(value) => (
            <div className="flex items-center gap-2">
              <FontAwesomeIcon icon={faLocationDot} />
              <span>{value.value}</span>
            </div>
          )}
        />
      </div>

      <div className="pb-4">
        {toggle.fetchData ? (
          <div>
            <Spinner />
          </div>
        ) : (
          <div>
            {showTimes.dataDisplay[selected.dateSelected]?.data?.length > 0 ? (
              showTimes.dataDisplay[selected.dateSelected]?.data?.map(
                (d, i: number) => (
                  <div key={i} className="pb-3">
                    <ShowTimeCard
                      data={d}
                      setTimesSelect={setTimesSelect}
                      timeSelected={timeSelected}
                    />
                  </div>
                )
              )
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
        )}
      </div>
    </div>
  );
}

export default ShowTime;
