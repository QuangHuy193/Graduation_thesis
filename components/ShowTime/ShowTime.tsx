"use client";
import { getCityAPI } from "@/lib/axios/cinemasAPI";
import { weekdays } from "@/lib/constant";
import { faLocationDot } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Select } from "antd";
import { useEffect, useState } from "react";
import styles from "./ShowTime.module.scss";

function ShowTime() {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });

  const [citys, setCitys] = useState([]);

  useEffect(() => {
    const getCitys = async () => {
      try {
        const res = await getCityAPI();
        setCitys(res);
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
      <div className="flex gap-3 justify-center mb-6">
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
      <div className="flex justify-between">
        <div className="text-4xl font-bold">DANH SÁCH RẠP</div>
        <Select
          className={styles.select}
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
    </div>
  );
}

export default ShowTime;
