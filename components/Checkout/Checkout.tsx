import { useEffect, useState } from "react";
import PaymentGateway from "../PaymentGateway/PaymentGateway";
import styles from "./Checkout.module.scss";
import InfoUserCheckout from "../InfoUserCheckout/InfoUserCheckout";
import { useSession } from "next-auth/react";
import { createBookingNoAuth, createBookingAuth, updateBookingToPaid } from "@/lib/axios/bookingAPI";
import { useSearchParams } from "next/navigation";
import InfoBooking from "../InfoBooking/InfoBooking";

type UserInfo = {
  name: string;
  phone: string;
  email: string;
  checkAge?: boolean;
  checkPolicy?: boolean;
};

function Checkout() {
  // const { user, setUser } = useAuth();
  const { data: session, status } = useSession();
  const user = session?.user ?? null;
  const [bookingData, setBookingData] = useState<any>(null);
  const [state, setState] = useState({
    step: 1,
  });
  const [auth, setAuth] = useState(false);
  //Dùng cho trường hợp ko đăng nhập (auth=false)
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  //demo
  const booking = {
    // amount: 2000,
    description: "Thanh toán hóa đơn CineGo",
    // items: [{ name: "Vé 2D", quantity: 2, price: 60000 }],
  };
  const searchParams = useSearchParams();
  const paymentStatus = searchParams.get("status");

  // const hanndlePayment = (method: any, payload: any) => {
  //   console.log("onPay called in Checkout:", method, payload);
  // };
  useEffect(() => {
    if (paymentStatus === "PAID") {
      const bookingIDRaw = sessionStorage.getItem("booking_id");
      const bookingID = Number(bookingIDRaw);
      console.log("Thanh toán thành công");

      if (bookingID) {
        updateBookingToPaid(bookingID);    // ⬅ Gọi API /booking/[id]
        setState((prev) => ({ ...prev, step: 3 }));
      }
    }
  }, [paymentStatus]);
  useEffect(() => {
    if (status === "authenticated" && user) {
      setState((prev) => ({ ...prev, step: 2 }));
      setAuth(true);
    }
  }, [status, user]);
  //Lấy lại booking data từ session
  useEffect(() => {
    const data = sessionStorage.getItem("bookingData");
    if (data) {
      setBookingData(JSON.parse(data));
    } else {
      // fallback khi user mở tab mới / reload mất data
      console.warn("Không tìm thấy bookingData");
    }
  }, []);
  async function handleCreateBooking() {
    if (!bookingData) {
      console.error("Không tìm thấy bookingData");
      return;
    }

    // Chuẩn hóa ngày để phù hợp MySQL DATE
    const normalizedDate = bookingData.date?.split("T")?.[0] || bookingData.date;

    let payload;

    if (!auth) {
      // ❗ Trường hợp chưa đăng nhập → lấy userInfo từ form
      if (!userInfo) {
        console.warn("Thiếu thông tin userInfo khi chưa đăng nhập");
        return;
      }

      payload = {
        total_price: bookingData.total_price,
        showtime_id: bookingData.showtime_id,
        showtime_date: normalizedDate,
        name: userInfo.name,
        phone: userInfo.phone,
        email: userInfo.email,
      };

      const res = await createBookingNoAuth(payload);
      console.log("Booking created (no-auth):", res.data.data.booking_id);

      // TODO: redirect sang Payment
      return res.data.data.booking_id;
    }
    if (!user?.user_id) {
      console.error("Không có user_id");
      return;
    }
    const userId = Number(user.user_id);
    // ✔ Trường hợp user đã đăng nhập (auth = true)
    payload = {
      total_price: bookingData.total_price,
      showtime_id: bookingData.showtime_id,
      showtime_date: normalizedDate,
      user_id: userId,
    };

    const res = await createBookingAuth(payload);

    console.log("Booking created (auth):", res.data.data.booking_id);
    return res.data.data.booking_id;
    // TODO: redirect sang Payment
  }

  return (
    <div>
      <div className="text-3xl font-bold pb-8">TRANG THANH TOÁN</div>
      <div className="flex pb-8">
        <div className=" flex flex-1 items-center gap-3 ">
          <div className={`${styles.step_title} text-(--color-yellow)`}>
            <div>1</div>
            <span>THÔNG TIN KHÁCH HÀNG</span>
          </div>
          <div className={`${state.step === 2 && "text-(--color-yellow)"}`}>
            {" "}
            -{" "}
          </div>
          <div
            className={`${styles.step_title} ${(state.step === 2 || state.step === 3) && "text-(--color-yellow)"
              }`}
          >
            <div>2</div>
            <span>THANH TOÁN</span>
          </div>
          <div> - </div>
          <div
            className={`${styles.step_title} ${state.step === 3 && "text-(--color-yellow)"
              }`}
          >
            <div>3</div>
            <span>THÔNG TIN VÉ</span>
          </div>
        </div>
        <div className="flex-1"></div>
      </div>
      <div className="flex gap-4">
        <div className="flex-1">
          {state.step === 1 && (
            <InfoUserCheckout
              changeStep={(step: number) => {
                setState((prev) => ({ ...prev, step: step }));
              }}
              onSaveUser={(formData: UserInfo) => {
                setUserInfo(formData);
              }}
            />
          )}
          {state.step === 2 && (
            <PaymentGateway
              buyer={userInfo ?? undefined}
              onPay={async (method: any, payload: any) => {

                const bookingID = await handleCreateBooking();
                sessionStorage.setItem("booking_id", bookingID);
              }}
              amount={bookingData.total_price}
              description={booking.description}
            // items={bookingData.}
            />
          )}
          {state.step === 3 && (
            <div>Thanh toán thành công</div>
          )

          }
        </div>
        <div className="flex-1 pb-5">
          <InfoBooking />
        </div>
      </div>
    </div>
  );
}

export default Checkout;
