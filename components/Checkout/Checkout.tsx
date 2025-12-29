import { useEffect, useState } from "react";
import PaymentGateway from "../PaymentGateway/PaymentGateway";
import styles from "./Checkout.module.scss";
import InfoUserCheckout from "../InfoUserCheckout/InfoUserCheckout";
import { useSession } from "next-auth/react";
import {
  createBookingNoAuth,
  createBookingAuth,
  updateBookingToPaid,
} from "@/lib/axios/bookingAPI";
import { useSearchParams } from "next/navigation";
import InfoBooking from "../InfoBooking/InfoBooking";
import { convertToTickets, toMySQLDate } from "@/lib/function";
import InfoTicket from "../InfoTicket/InfoTicket";

type UserInfo = {
  name: string;
  phone: string;
  email: string;
  checkAge?: boolean;
  checkPolicy?: boolean;
};
type UserSession = {
  id?: number | string;
  name?: string;
  email?: string;
  role?: string;
  vip?: string;
  status?: string;
} | null;
function Checkout() {
  // const { user, setUser } = useAuth();
  const { data: session, status } = useSession();
  const user = session?.user ?? null;
  let userSes: UserSession = null;

  if (typeof window !== "undefined") {
    const userStr = sessionStorage.getItem("user");
    userSes = userStr ? JSON.parse(userStr) : null;
  }

  const [bookingData, setBookingData] = useState<any>(null);
  // const [bookingID, setBookingID] = useState<any>(null);
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

  useEffect(() => {
    if (paymentStatus !== "PAID") return;

    const updateBooking = async (bookingID, data) => {
      await updateBookingToPaid(bookingID, data); // ⬅ Gọi API /booking/[id]
    };

    if (paymentStatus === "PAID") {
      const bookingIDRaw = sessionStorage.getItem("booking_id");
      const bookingID = Number(bookingIDRaw);
      // console.log("Thanh toán thành công" + paymentStatus);

      if (bookingID) {
        const bookingData = sessionStorage.getItem("bookingData");
        if (bookingData) {
          const data = JSON.parse(bookingData);
          const tickets = convertToTickets(data);
          updateBooking(bookingID, tickets);
        }
      }
    }
    setState((prev) => ({ ...prev, step: 3 }));
  }, [paymentStatus]);
  useEffect(() => {
    if ((status === "authenticated" && user) || userSes) {
      setAuth(true);
      // chỉ nâng step khi step hiện tại < 2
      setState((prev) => {
        if (!prev || typeof prev.step !== "number") return { ...prev, step: 2 };
        if (prev.step < 2) return { ...prev, step: 2 };
        return prev; // nếu đã >=2 thì không giảm lại
      });
    } else if (status === "unauthenticated" || !userSes) {
      setAuth(false);
    }
  }, [status, user, userSes]);

  async function handleCreateBooking() {
    if (!bookingData) {
      console.error("Không tìm thấy bookingData");
      return;
    }

    // Chuẩn hóa ngày để phù hợp MySQL DATE
    const normalizedDate = toMySQLDate(bookingData.date);
    if (!normalizedDate) {
      console.error("Không thể chuẩn hoá bookingData.date:", bookingData.date);
      setError("Dữ liệu ngày không hợp lệ"); // nếu bạn có state error
      return;
    }

    let payload;

    const currentUserId = user?.user_id
      ? Number(user.user_id)
      : userSes?.id
      ? Number(userSes.id)
      : null;

    if (!currentUserId) {
      console.error("Không có user_id");
      return;
    }

    // ✔ Trường hợp user đã đăng nhập (auth = true)
    payload = {
      total_price: bookingData.total_price,
      showtime_id: bookingData.showtime_id,
      user_id: currentUserId,
    };

    const res = await createBookingAuth(payload);

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
            className={`${styles.step_title} ${
              (state.step === 2 || state.step === 3) && "text-(--color-yellow)"
            }`}
          >
            <div>2</div>
            <span>THANH TOÁN</span>
          </div>
          <div> - </div>
          <div
            className={`${styles.step_title} ${
              state.step === 3 && "text-(--color-yellow)"
            }`}
          >
            <div>3</div>
            <span>THÔNG TIN VÉ</span>
          </div>
        </div>
        <div className="flex-1"></div>
      </div>
      {state.step !== 3 && (
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
                  if (bookingID) {
                    sessionStorage.setItem("booking_id", String(bookingID));
                  }
                  return bookingID;
                }}
                amount={bookingData.total_price}
                description={booking.description}
              />
            )}
            {state.step === 3 && <div>Thanh toán thành công</div>}
          </div>
          <div className="flex-1 pb-5">
            <InfoBooking />
          </div>
        </div>
      )}
      {state.step === 3 && (
        <InfoTicket
          bookingId={JSON.parse(sessionStorage.getItem("booking_id"))}
        />
      )}
    </div>
  );
}

export default Checkout;
function setError(arg0: string) {
  throw new Error("Function not implemented.");
}
