import { useEffect, useState } from "react";
import styles from "./InfoBooking.module.scss";
import Spinner from "../Spinner/Spinner";

function InfoBooking() {
  const [bookingData, setBookingData] = useState(null);

  useEffect(() => {
    const data = sessionStorage.getItem("bookingData");

    if (data) {
      setBookingData(JSON.parse(data));
    }
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
        <div>
          <span className={`${styles.sub_title}`}>THỜI GIAN GIỮ VÉ:</span>
          <span>5:00</span>
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
                {bookingData?.ticket[key]}
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
        <div className={`${styles.content}`}></div>
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
