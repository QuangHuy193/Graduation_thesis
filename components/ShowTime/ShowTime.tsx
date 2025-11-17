"use client";
import { getCityAPI } from "@/lib/axios/cinemasAPI";
import { weekdays } from "@/lib/constant";
import { faLocationDot } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Select } from "antd";
import { useEffect, useState } from "react";
import styles from "./ShowTime.module.scss";
import ShowTimeCard from "../ShowTimeCard/ShowTimeCard";
import Spinner from "../Spinner/Spinner";
const dataF = [
  {
    cinemas: {
      cinema_id: 1,
      name: "Rạp A",
      specific_address: "Số 123 đường Võ Thị Sáu",
      ward: "Phường 5",
      province: "Quảng Ninh",
      time: [
        {
          start_time: "18:00",
          end_time: "19:45",
        },
        {
          start_time: "11:00",
          end_time: "13:05",
        },
      ],
    },
  },
  {
    cinemas: {
      cinema_id: 2,
      name: "Rạp B",
      specific_address: "Số 74 đường Võ Thị Sáu",
      ward: "Phường 9",
      province: "TP. Hồ Chí Minh",
      time: [
        {
          start_time: "18:00",
          end_time: "19:45",
        },
        {
          start_time: "11:00",
          end_time: "13:05",
        },
      ],
    },
  },
];

function ShowTime() {
  const days = Array.from({ length: 5 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });

  const [citys, setCitys] = useState([]);
  const [showTimes, setShowtimes] = useState([]);
  const [selected, setSelected] = useState({
    provinceSelected: "",
    dateSelected: 0,
  });

  useEffect(() => {
    const getCitys = async () => {
      try {
        const res = await getCityAPI();
        setCitys(res);
        setSelected((prev) => ({ ...prev, provinceSelected: res[0].province }));
      } catch (error) {
        console.log(error);
      }
    };
    getCitys();
  }, []);

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

      <div>
        {showTimes.length > 0 ? (
          showTimes.map((data, i) => (
            <div key={i} className="mt-5">
              <ShowTimeCard data={data} />
            </div>
          ))
        ) : (
          <Spinner text="Đang tải dang sách rạp, suất chiếu..." />
        )}
      </div>
    </div>
  );
}

export default ShowTime;
