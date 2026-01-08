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
import {
  formatDateWithDay,
  getDateFromOffset,
  isSingleGap,
  isSingleGapRemove,
  scrollToPosition,
} from "@/lib/function";
import LoadingPage from "../LoadingPage/LoadingPage";
import { useEffect, useMemo, useRef, useState } from "react";
import VideoTrailer from "../VideoTrailer/VideoTrailer";
import ShowTime from "../ShowTime/ShowTime";
import PriceCard from "../PriceCard/PriceCard";
import Room from "../Room/Room";
import { getRoomAsileWithIdAPI } from "@/lib/axios/roomAPI";
import {
  getSeatsWithRoomShowtimeAPI,
  lockSeatAPI,
  unlockSeatAPI,
  unlocksSeatAPI,
} from "@/lib/axios/seatsAPI";
import Swal from "sweetalert2";
import Button from "../Button/Button";
import Spinner from "../Spinner/Spinner";
import { getFoodAPI } from "@/lib/axios/foodAPI";
import FoodDrinkList from "../FoodDrinkList/FoodDrinkList";
import { getShowtimeDetailAPI } from "@/lib/axios/showTimeAPI";
import Tippy from "@tippyjs/react";

function MovieDetail({
  data,
  movie_id,
}: {
  data: MovieFullITF[];
  movie_id: number;
}) {
  const [state, setState] = useState({
    // nút xem trailer
    watchTrailer: false,
    // giờ chọn
    timesSelected: {
      showtime_id: -1,
      room_id: -1,
      cinema_name: "",
      cinema_address: "",
      room_name: "",
      time: "",
    },
    // vé chọn
    ticketSelected: {},
    // ds khoảng trống phòng
    room_asile: {},
    // ds ghế của showtime
    seats: [],
    // ghế chọn
    seatSelected: [],
    // ds loại vé
    ticketTypes: [],
    // đồng hồ đếm giờ
    clock: { minute: 5, second: 0 },
    // ngày chọn
    dateSelected: 0,
    // đang gọi api
    isFetch: false,
    // ds food đã có phân loại
    foodList: {},
    // ds food đã chọn
    foodSelected: {},
  });

  // tính tổng số vé
  const totalTickets = useMemo(() => {
    const tickets = state.ticketSelected ?? {}; // fallback object
    return Object.values(tickets).reduce(
      (sum, item) => sum + (item?.quantity ?? 0),
      0
    );
  }, [state.ticketSelected]);

  // lấy dữ liệu từ session trường hợp đặt vé nhanh
  useEffect(() => {
    const getDataQuickTicket = async (
      movie_id: number,
      date: Date,
      time_id: number
    ) => {
      try {
        const res = await getShowtimeDetailAPI(movie_id, date, time_id);
        const data = res[0];
        setState((prev) => ({
          ...prev,
          timesSelected: {
            showtime_id: data.showtime_id,
            room_id: data.room_id,
            cinema_name: data.cinema_name,
            cinema_address: data.cinema_address,
            room_name: data.room_name,
            time: data.time,
          },
        }));
      } catch (error) {
        console.log(error);
      }
    };

    const quickTicketData = sessionStorage.getItem("quickticket");
    if (quickTicketData) {
      const data = JSON.parse(quickTicketData);
      console.log(data);
      getDataQuickTicket(data.movie_id, data.date, data.times);
    }
    return () => {
      // cleanup khi unmount
      sessionStorage.removeItem("quickticket");
    };
  }, []);

  // gọi api lấy ds food
  useEffect(() => {
    const getFoods = async () => {
      try {
        const res = await getFoodAPI();
        setState((prev) => ({ ...prev, foodList: res }));
      } catch (error) {
        console.log(error);
      }
    };
    getFoods();
  }, []);

  // unlock nhiều ghế bằng beacon
  const handleUnload = () => {
    if (!state.seatSelected || state.seatSelected.length === 0) return;

    const payload = JSON.stringify({
      seats: state.seatSelected.map((s) => s.seat_id),
      showtime_id: state.timesSelected.showtime_id,
    });

    navigator.sendBeacon("/api/seats/unlocks", payload);
  };

  // unlock nhiều ghế
  const handleUnlocks = async (seats, showtime) => {
    await unlocksSeatAPI(seats, showtime);
  };

  // hàm chọn ghế
  const handleSelectSeat = async (
    seat_id: number,
    label: string,
    rowSeat: [],
    colSeat: number,
    aside: []
  ) => {
    const { ticketSelected, seatSelected } = state;

    //chưa chọn ghế
    if (totalTickets === 0) {
      Swal.fire({
        title: "Lưu ý!",
        text: "Bạn chưa chọn loại vé!",
        confirmButtonText: "ĐỒNG Ý",
        customClass: {
          popup: "popup_alert",
          confirmButton: `btn_alert`,
          cancelButton: `btn_alert`,
        },
      });
      return;
    }

    // tổng số ghế đã chọn
    const totalSeats = seatSelected.length;

    // kiểm tra nếu ghế đã chọn thì bỏ chọn
    const existing = seatSelected.find((s) => s.seat_id === seat_id);
    if (existing) {
      // kiểm tra trước khi bỏ chọn
      if (isSingleGapRemove(rowSeat, colSeat)) {
        Swal.fire({
          title: "Lưu ý!",
          text: "Việc chọn ghế của bạn không được để trống 1 ghế ở bên trái, giữa hoặc bên phải trên cùng một hàng ghế mà bạn vừa chọn!",
          confirmButtonText: "ĐỒNG Ý",
          buttonsStyling: false,
          customClass: {
            popup: "popup_alert",
            confirmButton: `btn_alert`,
            cancelButton: `btn_alert`,
          },
        });
        return;
      }
      // mở ghế
      const res = await unlockSeatAPI(seat_id, state.timesSelected.showtime_id);
      if (res.success) {
        console.log("Đã mở lại ghế");
        setState((prev) => ({
          ...prev,
          seatSelected: prev.seatSelected.filter((s) => s.seat_id !== seat_id),
        }));
      }

      return;
    }

    // nếu chưa đủ số ghế → chọn tiếp
    if (totalSeats < totalTickets) {
      // kiểm tra vị trí ghế
      if (isSingleGap(rowSeat, colSeat, aside)) {
        Swal.fire({
          title: "Lưu ý!",
          text: "Việc chọn ghế của bạn không được để trống 1 ghế ở bên trái, giữa hoặc bên phải trên cùng một hàng ghế mà bạn vừa chọn!",
          confirmButtonText: "ĐỒNG Ý",
          buttonsStyling: false,
          customClass: {
            popup: "popup_alert",
            confirmButton: `btn_alert`,
            cancelButton: `btn_alert`,
          },
        });
        return;
      }
      // khóa ghế
      const res = await lockSeatAPI(seat_id, state.timesSelected.showtime_id);
      if (res.success) {
        console.log("Đã khóa ghế thành công");
      } else {
        Swal.fire({
          title: "Lưu ý!",
          text: "Ghế đang được giữ bởi người khác!!!",
          confirmButtonText: "ĐỒNG Ý",
          buttonsStyling: false,
          customClass: {
            popup: "popup_alert",
            confirmButton: `btn_alert`,
            cancelButton: `btn_alert`,
          },
        });
        return;
      }

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
        seatSelected: [
          ...prev.seatSelected,
          { seat_id, type: typeToUse, label },
        ],
      }));
    } else {
      Swal.fire({
        title: "Lưu ý!",
        text: "Bạn đã mua đủ số ghế!",
        confirmButtonText: "ĐỒNG Ý",
        buttonsStyling: false,
        customClass: {
          popup: "popup_alert",
          confirmButton: `btn_alert`,
          cancelButton: `btn_alert`,
        },
      });
    }
  };

  // khi giờ chiếu thay đổi
  useEffect(() => {
    // sau đó mới reset
    setState((prev) => ({ ...prev, seatSelected: [], ticketSelected: {} }));
    if (
      state.timesSelected?.room_id === -1 ||
      state.timesSelected?.showtime_id === -1
    ) {
      return;
    }

    if (state.timesSelected?.showtime_id !== -1) {
      scrollToPosition(0, true, "select_ticket_type", 120);
    }

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
      state.timesSelected?.room_id !== -1 &&
      state.timesSelected?.showtime_id !== -1
    ) {
      getRoomAsile(state.timesSelected?.room_id);
      getSeats(state.timesSelected?.room_id, state.timesSelected?.showtime_id);
    }
  }, [state.timesSelected]);

  // khi date thay đổi
  useEffect(() => {
    handleUnlocks(
      state.seatSelected?.map((s) => s.seat_id),
      state.timesSelected?.showtime_id
    );
  }, [state.dateSelected]);

  // khi vé thay đổi
  useEffect(() => {
    if (!state.ticketSelected) {
      scrollToPosition(0, true, "select_seat", 100, 2000);
    }
    handleUnlocks(
      state.seatSelected?.map((s) => s.seat_id),
      state.timesSelected?.showtime_id
    );
    setState((prev) => ({ ...prev, seatSelected: [] }));
  }, [state.ticketSelected]);

  // Hàm async riêng để unlock ghế và show alert khi hết giờ
  const handleTimerEnd = async () => {
    unlocksSeatAPI(
      state.seatSelected.map((s) => s.seat_id),
      state.timesSelected.showtime_id
    );
    setState((prev) => ({
      ...prev,
      ticketSelected: {},
      timesSelected: {
        showtime_id: -1,
        room_id: -1,
        cinema_name: "",
        cinema_address: "",
        room_name: "",
        time: "",
      },
      clock: { minute: 5, second: 0 },
    }));

    Swal.fire({
      title: "LƯU Ý!",
      text: "Đã hết thời gian giữ vé!",
      confirmButtonText: "ĐỒNG Ý",
      buttonsStyling: false,
      allowOutsideClick: false,
      customClass: {
        popup: "popup_alert",
        confirmButton: "btn_alert",
      },
    }).then((result: any) => {
      if (result.isConfirmed) scrollToPosition(0);
    });
  };

  // bật bộ đếm giờ
  const timerStarted = useRef(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (state.seatSelected?.length === 0) return;

    if (!timerStarted.current) {
      timerStarted.current = true;

      timerRef.current = setInterval(() => {
        setState((prev) => {
          let { minute, second } = prev.clock;

          if (minute === 0 && second === 0) {
            clearInterval(timerRef.current!);
            timerStarted.current = false;

            handleTimerEnd();
            return prev;
          }

          if (second > 0) {
            second -= 1;
          } else {
            second = 59;
            minute -= 1;
          }

          return { ...prev, clock: { minute, second } };
        });
      }, 1000);
    }
  }, [state.seatSelected]);

  // khi unmount xóa timeout
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // hàm tăng giảm chọn bắp nước
  const handleSelectedFood = (name: string, price: number, inc: boolean) => {
    setState((prev) => {
      const oldValue = prev.foodSelected?.[name]?.quantity ?? 0;

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
        foodSelected: {
          ...prev.foodSelected,
          [name]: {
            quantity: newValue,
            price: price,
          },
        },
      };
    });
  };

  // gửi thông tin vé đi khi bấm đặt vé
  const handleBooking = () => {
    const date = getDateFromOffset(state.dateSelected);
    //tính tổng
    const totalTicket = Object.keys(state.ticketSelected).reduce((sum, key) => {
      const item = state.ticketSelected[key];
      return sum + item.quantity * item.price;
    }, 0);
    const totalFood = Object.keys(state.foodSelected).reduce((sum, key) => {
      const item = state.foodSelected[key];
      return sum + item.quantity * item.price;
    }, 0);
    // thêm id cho food
    const selectedFoodsWithId = Object.keys(state.foodSelected).map((name) => {
      const foodInfo = state.foodSelected[name]; // { quantity, price }
      let foodInList = state.foodList.foods.find((f: any) => f.name === name);
      if (!foodInList)
        foodInList = state.foodList.combos.find((f: any) => f.name === name);
      if (!foodInList)
        foodInList = state.foodList.drinks.find((f: any) => f.name === name);
      return {
        [name]: {
          ...foodInfo,
          food_id: foodInList ? foodInList.food_id : null, // nếu không tìm thấy thì null
        },
      };
    });
    const bookingData = {
      showtime_id: state.timesSelected.showtime_id,
      total_price: totalFood + totalTicket,
      movie_name: data[0].name,
      age_require: data[0].age_require,
      cinema_name: state.timesSelected.cinema_name,
      cinema_address: state.timesSelected.cinema_address,
      time: state.timesSelected.time,
      date: date,
      room_name: state.timesSelected.room_name,
      ticket: state.ticketSelected,
      seats: state.seatSelected,
      food_drink: selectedFoodsWithId,
      ticket_type: state.ticketTypes,
    };
    sessionStorage.setItem("bookingData", JSON.stringify(bookingData));
  };

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
      <div className="flex flex-col">
        <div className="flex gap-2">
          <div className="flex-4">
            <div className="relative h-[330px] md:h-[500px] lg:h-[550px]">
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
          <div className="flex-6">
            <h1 className="uppercase text-2xl md:text-4xl font-bold py-1 mb-4">
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
            {/* mo tả */}
            <div className="hidden md:block">
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
            </div>
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
                onClose={() =>
                  setState((prev) => ({ ...prev, watchTrailer: false }))
                }
                src={data[0].trailer_url}
              />
            )}
          </div>
        </div>
        <div className="block md:hidden">
          {/* mo tả mobile*/}
          <h3 className={`${styles.sub_title}`}>MÔ TẢ</h3>
          <div>
            <div className="text-[13px]">
              Diễn viên:{" "}
              {data[0].actors.map((actor, i) => (
                <span key={i}>
                  {actor}
                  {i < data[0].actors.length - 1 ? ", " : ", ..."}
                </span>
              ))}
            </div>
            <div className="text-[13px]">
              Khởi chiếu: {formatDateWithDay(data[0].release_date)}
            </div>
          </div>
          <h3 className={`${styles.sub_title} `}>NỘI DUNG</h3>
          <div className="text-[13px]">{data[0].description}</div>
        </div>
      </div>
      {/* hiện lịch chiếu */}
      <div>
        <ShowTime
          // mở tất cả
          unlockseats={(showtime_id) => {
            handleUnlocks(
              state.seatSelected.map((s) => s.seat_id),
              showtime_id
            );
          }}
          movie_id={movie_id}
          setTimesSelect={(obj) =>
            setState((prev) => ({
              ...prev,
              timesSelected: obj,
            }))
          }
          timeSelected={state.timesSelected}
          setTicketTypes={(arr) => {
            setState((prev) => ({ ...prev, ticketTypes: arr }));
          }}
          // set date trong component cha
          setDateSelected={(date: number) => {
            setState((prev) => ({ ...prev, dateSelected: date }));
          }}
          isFetch={(flag) => {
            setState((prev) => ({ ...prev, isFetch: flag }));
          }}
        />
      </div>

      {/* chọn loại vé, ghế, bắp nước */}
      <div id="select_ticket_type" className="mt-10 md:mt-16">
        {!state.isFetch ? (
          <div>
            {state?.timesSelected?.showtime_id !== -1 &&
              state?.ticketTypes?.length !== 0 && (
                <>
                  {/* hiện loại vé */}
                  <div className="md:pb-4 md:pt-10">
                    <div
                      className="flex justify-center text-2xl md:text-4xl font-bold mb-2 
                    md:mb-12"
                    >
                      CHỌN LOẠI VÉ
                    </div>

                    <div className="flex justify-center">
                      <div
                        className="mt-2 mb-10 px-5 py-3 bg-red-50 border border-red-300 
                    rounded-xl text-red-700 text-sm shadow-sm max-w-2xl text-center 
                    leading-relaxed flex items-center gap-2"
                      >
                        <span>
                          <span className="font-semibold text-red-800">
                            Lưu ý quan trọng:
                          </span>{" "}
                          Đối với vé HS-SV, bạn <u>bắt buộc</u> phải mang theo
                          CCCD hoặc thẻ HSSV có dán ảnh để xác minh trước khi
                          vào rạp. Nhân viên rạp có thể từ chối không cho bạn
                          vào xem nếu không thực hiện đúng quy định này.
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col md:flex-row gap-3 md:gap-6 justify-center">
                      {state?.ticketTypes?.map((t, i) => (
                        <div key={i} className="flex justify-center">
                          <PriceCard
                            data={t}
                            setTicketSelected={(name, price, inc) => {
                              setState((prev) => {
                                const oldValue =
                                  prev.ticketSelected?.[name]?.quantity ?? 0;

                                let totalTickets = 0;
                                Object.keys(prev.ticketSelected).map((k) => {
                                  totalTickets +=
                                    prev.ticketSelected?.[k]?.quantity;
                                });

                                if (totalTickets === 8 && inc) {
                                  Swal.fire({
                                    text: "Vui lòng chọn tối đa 8 ghế",
                                    confirmButtonText: "ĐỒNG Ý",
                                    customClass: {
                                      popup: "popup_alert",
                                      confirmButton: `btn_alert`,
                                      cancelButton: `btn_alert`,
                                    },
                                  });
                                  return prev;
                                }
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
                                    [name]: {
                                      quantity: newValue,
                                      price: price,
                                    },
                                  },
                                };
                              });
                            }}
                            ticketSelected={state.ticketSelected}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* hiện phòng */}
                  <div id="select_seat" className="pb-4 pt-10">
                    <Room
                      data={state.room_asile}
                      seats={state.seats}
                      selectSeat={(seat_id, label, rowSeat, colSeat, aside) => {
                        handleSelectSeat(
                          seat_id,
                          label,
                          rowSeat,
                          colSeat,
                          aside
                        );
                      }}
                      seatSelected={state.seatSelected}
                    />
                  </div>

                  {/* hiện bắp nước */}
                  <div className="pb-4 pt-10">
                    <div className="flex justify-center text-2xl md:text-4xl font-bold mb-12">
                      CHỌN BẮP NƯỚC
                    </div>
                    <div className="pb-4">
                      <FoodDrinkList
                        title="Combo"
                        data={state?.foodList?.combos}
                        setFoodSelected={(name, price, inc) => {
                          handleSelectedFood(name, price, inc);
                        }}
                        foodSelected={state.foodSelected}
                      />
                    </div>
                    <div className="pb-4">
                      <FoodDrinkList
                        title="Bắp"
                        data={state?.foodList?.foods}
                        setFoodSelected={(name, price, inc) => {
                          handleSelectedFood(name, price, inc);
                        }}
                        foodSelected={state.foodSelected}
                      />
                    </div>
                    <div className="pb-4">
                      <FoodDrinkList
                        title="Nước ngọt"
                        data={state?.foodList?.drinks}
                        setFoodSelected={(name, price, inc) => {
                          handleSelectedFood(name, price, inc);
                        }}
                        foodSelected={state.foodSelected}
                      />
                    </div>
                  </div>
                </>
              )}
          </div>
        ) : (
          <div className="pb-5">
            <Spinner />
          </div>
        )}
      </div>

      {/* thanh tổng kết */}
      <div
        className="flex flex-col md:flex-row items-start md:justify-between border-t
      border-t-gray-50 py-3"
      >
        <div className="md:flex-1">
          <div className="text-2xl font-bold my-1">
            {data[0].name} ({data[0].age_require})
          </div>
          <div className="my-1">
            {state?.timesSelected?.cinema_name}
            {/* hiện vé */}
            {state?.ticketSelected &&
              Object.keys(state.ticketSelected).map((key) => (
                <span key={key}>
                  | {state.ticketSelected[key]?.quantity} vé {key}{" "}
                </span>
              ))}
          </div>
          <div className="my-1">
            {state.timesSelected?.room_name !== "" &&
              state.timesSelected?.time !== "" &&
              state.timesSelected?.room_name +
                " | " +
                state.timesSelected?.time}
            {state.seatSelected?.length !== 0 &&
              state.seatSelected?.map((m) => (
                <span key={m.seat_id}> | {m.label}</span>
              ))}
          </div>
          <div>
            {state.foodSelected &&
              Object.keys(state.foodSelected).map((key, i, arr) => (
                <span key={i}>
                  {state.foodSelected[key]?.quantity} {key}{" "}
                  {i < arr.length - 1 && ", "}
                </span>
              ))}
          </div>
        </div>
        <div
          className="flex flex-col md:flex-row gap-3 py-2 md:py-0 md:flex-1 md:justify-end
        w-full"
        >
          <div
            className="text-black bg-(--color-yellow) rounded-sm px-2 py-1 md:py-4
          flex md:block gap-2 items-center w-fit"
          >
            <div className="text-sm">Thời gian giữ vé:</div>
            <div className="font-bold">
              {state.clock?.minute?.toString().padStart(2, "0")}:
              {state.clock?.second?.toString().padStart(2, "0")}
            </div>
          </div>
          <div className="flex flex-col justify-between">
            <div className="flex justify-between">
              <span>Tạm tính:</span>
              <span className="font-bold">
                {
                  // tổng tiền vé
                  (
                    state.ticketSelected &&
                    state.foodSelected &&
                    Object.keys(state.ticketSelected).reduce((sum, key) => {
                      const item = state.ticketSelected[key];
                      return sum + item.quantity * item.price;
                    }, 0) +
                      // tổng tiền combo / food
                      Object.keys(state.foodSelected).reduce((sum, key) => {
                        const item = state.foodSelected[key];
                        return sum + item.quantity * item.price;
                      }, 0)
                  )?.toLocaleString("vi-VN")
                }{" "}
                VNĐ
              </span>
            </div>
            <div className="relative" onClick={() => handleBooking()}>
              <Button
                wfull={true}
                text="ĐẶT VÉ"
                text_color="black"
                hover_bg_color="#5E4CA2"
                p_l_r="80px"
                link="/checkout"
              />

              {totalTickets === 0 ? (
                <Tippy placement="bottom" content="Bạn chưa chọn vé.">
                  <div className="bg-black/30 absolute top-0 left-0 h-full w-full z-10"></div>
                </Tippy>
              ) : (
                (state.seatSelected.length !== totalTickets ||
                  totalTickets === 0) && (
                  <Tippy
                    placement="bottom"
                    content="Vui lòng chọn đủ số ghế để đặt vé."
                  >
                    <div className="bg-black/30 absolute top-0 left-0 h-full w-full z-10"></div>
                  </Tippy>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MovieDetail;
