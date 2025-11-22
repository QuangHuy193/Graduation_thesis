import PaymentGateway from "../PaymentGateway/PaymentGateway";

function Checkout() {
  const hanndlePayment = (method: any, payload: any) => {
    method = "momo";
    payload = {};
  }
  return (
    <div>
      <div>bước 1-bước 2-bước 3</div>
      <div>
        <div>thay đổi theo bước</div>
        <div>Thông tin booking</div>
        <div><PaymentGateway onPay={(hanndlePayment)} /></div>
      </div>
    </div>
  );
}

export default Checkout;
