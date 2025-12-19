"use client";

import { getCinemasWithCityAPI } from "@/lib/axios/cinemasAPI";
import { getAllRoomInCinemaAPI } from "@/lib/axios/roomAPI";
import { useEffect, useState } from "react";
import Spinner from "../Spinner/Spinner";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCirclePause,
  faCirclePlay,
  faEllipsisVertical,
  faMap,
} from "@fortawesome/free-solid-svg-icons";
import Tippy from "@tippyjs/react";

function RoomList() {
  const [state, setState] = useState({
    isFetch: false,
    openPopup: -1,
    cinemaList: [],
    roomList: [],
    selected: {
      cinema: -1,
    },
  });

  useEffect(() => {
    const getCinemas = async () => {
      try {
        setState((prev) => ({ ...prev, isFetch: true }));
        const res = await getCinemasWithCityAPI();
        setState((prev) => ({ ...prev, cinemaList: res }));
        setState((prev) => ({
          ...prev,
          selected: { ...prev.selected, cinema: res[0].cinema_id },
        }));
      } catch (error) {
        console.log(error);
      } finally {
        setState((prev) => ({ ...prev, isFetch: false }));
      }
    };
    getCinemas();
  }, []);

  useEffect(() => {
    if (state.selected.cinema === -1) return;

    const getRoomsIncinema = async (cinema_id) => {
      try {
        setState((prev) => ({ ...prev, isFetch: true }));
        const res = await getAllRoomInCinemaAPI(cinema_id);
        setState((prev) => ({ ...prev, roomList: res }));
      } catch (error) {
        console.log(error);
      } finally {
        setState((prev) => ({ ...prev, isFetch: false }));
      }
    };
    getRoomsIncinema(state.selected.cinema);
  }, [state.selected.cinema]);

  return (
    <div className="bg-white rounded shadow">
      <div className="py-2">
        <label className="px-2">Rạp:</label>
        <select
          className="border rounded px-2 py-2 text-sm focus:outline-0 hover:cursor-pointer"
          value={state.selected.cinema}
          onChange={(e) =>
            setState((prev) => ({
              ...prev,
              selected: {
                ...prev.selected,
                cinema: e.target.value,
              },
            }))
          }
        >
          {state.cinemaList.map((c) => (
            <option key={c.cinema_id} value={c.cinema_id}>
              {c.name + " (" + c.province + ")"}
            </option>
          ))}
        </select>
      </div>

      {state.roomList.length === 0 ? (
        state.isFetch ? (
          <div className="py-7">
            <Spinner />
          </div>
        ) : (
          <div className="flex justify-center italic py-7">
            Rạp hiện chưa có phòng nào
          </div>
        )
      ) : (
        <div className="py-2 px-3">
          <div
            className="grid grid-cols-5 border-b border-b-gray-400 gap-2 font-bold 
          py-2"
          >
            <div>Tên</div>
            <div className="flex justify-center">Chiều dài (ghế)</div>
            <div className="flex justify-center">Chiều rộng (ghế)</div>
            <div className="flex justify-center">Số ghế tối đa</div>
            <div className="flex justify-center">Trạng thái</div>
          </div>
          {state.roomList.map((r, index) => (
            <div
              key={r.room_id}
              className={`w-full grid grid-cols-5 py-3 ${
                index !== state.roomList.length - 1 &&
                "border-b border-b-gray-400"
              } relative `}
            >
              <div>{r.name}</div>
              <div className="flex justify-center">{r.width}</div>
              <div className="flex justify-center">{r.height}</div>
              <div className="flex justify-center">{r.capacity}</div>
              <div
                className={`flex justify-center ${
                  r.status === 1 ? "text-green-400" : "text-red-500"
                }`}
              >
                {r.status === 1 ? "Hoạt động" : "Không hoạt động"}
              </div>

              <Tippy
                visible={state.openPopup === r.room_id ? true : false}
                interactive
                theme="room"
                content={
                  <div
                    className="min-w-[200px] rounded-xl bg-white border
                   border-gray-100 py-1 text-sm"
                  >
                    {/* Xem sơ đồ */}
                    <div
                      className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 
                      cursor-pointer transition"
                    >
                      <FontAwesomeIcon icon={faMap} className="text-gray-500" />
                      <span
                        className="text-gray-700"
                        onClick={() => {
                          console.log("sơ đồ");
                          setState((prev) => ({
                            ...prev,
                            openPopup: -1,
                          }));
                        }}
                      >
                        Xem sơ đồ phòng
                      </span>
                    </div>

                    <div className="h-px bg-gray-200 my-1" />

                    {/* Trạng thái */}
                    {r.status === 1 ? (
                      <div
                        className="flex items-center gap-3 px-4 py-2 hover:bg-red-50 
                        cursor-pointer transition text-red-600"
                      >
                        <FontAwesomeIcon
                          icon={faCirclePause}
                          className="text-red-500"
                        />
                        <span
                          onClick={() => {
                            console.log("dừng");
                            setState((prev) => ({
                              ...prev,
                              openPopup: -1,
                            }));
                          }}
                        >
                          Tạm dừng hoạt động
                        </span>
                      </div>
                    ) : (
                      <div
                        className="flex items-center gap-3 px-4 py-2 hover:bg-green-50 
                        cursor-pointer transition text-green-600"
                      >
                        <FontAwesomeIcon
                          icon={faCirclePlay}
                          className="text-green-500"
                        />
                        <span
                          onClick={() => {
                            console.log("hoạt động");
                            setState((prev) => ({
                              ...prev,
                              openPopup: -1,
                            }));
                          }}
                        >
                          Hoạt động trở lại
                        </span>
                      </div>
                    )}
                  </div>
                }
              >
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center">
                  <FontAwesomeIcon
                    icon={faEllipsisVertical}
                    className="cursor-pointer"
                    onClick={() =>
                      setState((prev) => ({
                        ...prev,
                        openPopup:
                          prev.openPopup === r.room_id ? -1 : r.room_id,
                      }))
                    }
                  />
                </div>
              </Tippy>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default RoomList;
