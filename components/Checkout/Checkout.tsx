import { useEffect, useState } from "react";
import PaymentGateway from "../PaymentGateway/PaymentGateway";
import styles from "./Checkout.module.scss";
import InfoUserCheckout from "../InfoUserCheckout/InfoUserCheckout";

function Checkout() {
  const [state, setState] = useState({
    step: 1,
  });

  const hanndlePayment = (method: any, payload: any) => {
    method = "momo";
    payload = {};
  };

  useEffect(() => {
    // kiểm tra đăng nhập có thì qua thẳng step 2
  }, []);
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
      <div className="flex gap-4">
        <div className="flex-1">
          {state.step === 1 && (
            <InfoUserCheckout
              changeStep={(step: number) => {
                setState((prev) => ({ ...prev, step: step }));
              }}
            />
          )}
          {state.step === 2 && <PaymentGateway onPay={hanndlePayment} />}
        </div>
        <div className="flex-1">Thông tin booking</div>
      </div>
    </div>
  );
}

export default Checkout;
