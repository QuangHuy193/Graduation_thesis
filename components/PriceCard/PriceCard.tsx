import { faMinus, faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import styles from "./PriceCard.module.scss";
import Swal from "sweetalert2";

function PriceCard({
  data,
  setTicketSelected,
  ticketSelected,
}: {
  setTicketSelected: (name: string, inc: boolean) => void;
  ticketSelected: object;
}) {
  const handleInc = (name: string, inc: boolean, flag: boolean) => {
    if (!ticketSelected[data.name] && name === "HS-SV") {
      {
        Swal.fire({
          text: `Bạn đang mua hạng vé đặc biệt dành cho HSSV. 
          Vui lòng mang theo CCCD hoặc thẻ HSSV có dán ảnh để xác minh trước khi vào rạp. 
          Nhân viên rạp có thể từ chối không cho bạn vào xem 
          nếu không thực hiện đúng quy định này. Trân trọng cảm ơn`,
          showCancelButton: true,
          confirmButtonText: "ĐỒNG Ý",
          cancelButtonText: "HỦY",
          buttonsStyling: false,
          customClass: {
            popup: "popup_alert",
            confirmButton: `btn_alert`,
            cancelButton: `btn_alert`,
          },
        }).then((result: any) => {
          if (result.isConfirmed) {
            setTicketSelected(name, inc);
          }
        });
      }
    } else {
      setTicketSelected(name, inc);
    }
  };
  return (
    <div
      className="bg-transparent border border-gray-300 rounded-sm p-5 flex flex-col
    justify-between h-full "
    >
      <div
        className="text-[16px] font-semibold uppercase hover:text-(--color-yellow)
      hover:cursor-pointer w-fit pr-2"
      >
        {data.name}
      </div>
      <div className="text-[16px] font-semibold">
        {data.price.toLocaleString("en-US")} VNĐ
      </div>
      <div
        className="text-black w-[100px] flex bg-gray-50 items-center justify-between
      rounded-sm font-semibold px-1.5 py-2 hover:bg-(--color-yellow) "
      >
        <FontAwesomeIcon
          className={`${styles.btn_inc_dec}`}
          icon={faMinus}
          onClick={() => setTicketSelected(data.name, false)}
        />
        <p>{ticketSelected?.[data.name] ?? 0}</p>
        <FontAwesomeIcon
          className={`${styles.btn_inc_dec}`}
          icon={faPlus}
          onClick={() => handleInc(data.name, true, true)}
        />
      </div>
    </div>
  );
}

export default PriceCard;
