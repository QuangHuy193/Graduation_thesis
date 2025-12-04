import { useEffect, useState } from "react";
import styles from "./InfoBooking.module.scss";
import Spinner from "../Spinner/Spinner";
import Swal from "sweetalert2";
import { useRouter } from "next/navigation";
import { lockSeatAPI } from "@/lib/axios/seatsAPI";

function InfoBooking() {
  const router = useRouter();
  const [bookingData, setBookingData] = useState(null);
  const [state, setState] = useState({
    clock: { minute: 5, second: 0 },
  });

  const lockSeat = async (seats, showtime_id) => {
    for (const seat of seats) {
      console.log("lock: ", seat.seat_id, showtime_id);
      await lockSeatAPI(seat.seat_id, showtime_id);
    }
  };

  useEffect(() => {
    const data = sessionStorage.getItem("bookingData");
    if (data) {
      const dataString = JSON.parse(data);
      setBookingData(dataString);
      lockSeat(dataString.seats, dataString.showtime_id);
    }

    const timer = setInterval(() => {
      // bật đếm giờ
      setState((prev) => {
        let { minute, second } = prev.clock;
        if (minute === 0 && second === 0) {
          clearInterval(timer);
          Swal.fire({
            title: "LƯU Ý!",
            text: "Đã hết thời gian giữ vé, vui lòng thao tác lại!",
            confirmButtonText: "ĐỒNG Ý",
            buttonsStyling: false,
            allowOutsideClick: false,
            customClass: {
              popup: "popup_alert",
              confirmButton: "btn_alert",
            },
          }).then((result: any) => {
            if (result.isConfirmed) {
              router.back();
            }
          });
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
    return () => clearInterval(timer);
  }, []);

  if (bookingData === null) {
    return <Spinner />;
  }
  return (
    <div className="bg-[#3366CC] px-5 pt-2 pb-7">
      <div
        className={`${styles.sub_container} flex justify-between items-center`}
      >
        <div className="text-xl font-bold uppercase">
          {bookingData?.movie_name} (T{bookingData?.age_require})
        </div>
        <div className="flex gap-2 items-center">
          <span>THỜI GIAN GIỮ VÉ:</span>
          <span
            className={`text-black font-bold bg-(--color-yellow) rounded-sm px-4 py-1`}
          >
            {state.clock.minute}:{state.clock.second}
          </span>
        </div>
      </div>

      <div className={`${styles.sub_container} ${styles.sub_title}`}>
        Phim dành cho khán giả từ {bookingData?.age_require} tuổi trở lên (
        {bookingData?.age_require}+)
      </div>

      <div className={`${styles.sub_container} `}>
        <div className={`${styles.content}`}>{bookingData?.cinema_name}</div>
        <div>{bookingData?.cinema_address}</div>
      </div>

      <div className={`${styles.sub_container}`}>
        <div className={`${styles.sub_title}`}>Thời gian</div>
        <div>
          {bookingData?.time} {bookingData?.date.full}
        </div>
      </div>

      <div className={`${styles.sub_container} flex gap-4`}>
        <div>
          <div className={`${styles.sub_title}`}>Phòng chiếu</div>
          <div className={`${styles.content}`}>{bookingData?.room_name}</div>
        </div>
        {Object.keys(bookingData?.ticket).map((key) => (
          <>
            <div>
              <div className={`${styles.sub_title}`}>Số vé</div>
              <div className={`${styles.content}`}>
                {bookingData.ticket[key]?.quantity}
              </div>
            </div>
            <div>
              <div className={`${styles.sub_title}`}>Loại vé</div>
              <div className={`${styles.content}`}>{key}</div>
            </div>
          </>
        ))}
      </div>

      <div className={`${styles.sub_container}`}>
        <div className={`${styles.sub_title}`}>Số ghế</div>
        <div className={`${styles.content}`}>
          {bookingData?.seats.map((s, i) => (
            <span key={s.seat_id}>
              {s.label}
              {i < bookingData?.seats.length - 1 && ", "}
            </span>
          ))}
        </div>
      </div>

      <div className={`${styles.sub_container}`}>
        <div className={`${styles.sub_title}`}>Bắp nước</div>
        <div className={`${styles.content}`}>
          {bookingData?.food_drink.map((f, i) => (
            <span key={i}>
              {Object.keys(f).map((key, i, arr) => (
                <span key={i}>
                  {f[key]?.quantity} {key} {i < arr.length - 1 && ", "}
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>

      <div className={`${styles.sub_container} border-b border-gray-100`}></div>

      <div className={`${styles.sub_container} flex justify-between`}>
        <div className={`text-(--color-yellow) font-semibold`}>
          SỐ TIỀN CẦN THANH TOÁN
        </div>
        <div className={`text-xl font-bold`}>
          {Number(bookingData?.total_price).toLocaleString("vi-VN")} VNĐ
        </div>
      </div>
    </div>
  );
}

export default InfoBooking;
