"use client";
import { getCityAPI } from "@/lib/axios/cinemasAPI";
import { weekdays } from "@/lib/constant";
import { faLocationDot } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Select } from "antd";
import { useEffect, useState } from "react";
import styles from "./ShowTime.module.scss";
import ShowTimeCard from "../ShowTimeCard/ShowTimeCard";
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
  const [citySelectd, setCitySelectd] = useState("");

  useEffect(() => {
    const getCitys = async () => {
      try {
        const res = await getCityAPI();
        setCitys(res);
        setCitySelectd(res[0].province);
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
            key={idx}
            className="h-20 w-24 border border-(--color-yellow) rounded-sm flex flex-col 
            items-center justify-center cursor-pointer"
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
            setCitySelectd(value);
          }}
          className={`${styles.select} w-[180px]`}
          value={citySelectd}
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
        {dataF.map((data, i) => (
          <div key={i} className="mt-5">
            <ShowTimeCard data={data} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default ShowTime;
