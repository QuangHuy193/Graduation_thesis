import { faMinus, faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import styles from "./PriceCard.module.scss";
import Image from "next/image";

function PriceCard({
  data,
  setTicketSelected,
  ticketSelected,
}: {
  setTicketSelected: (name: string, price: number, inc: boolean) => void;
  ticketSelected: object;
}) {
  return (
    <div
      className={`flex bg-transparent p-5 gap-2 w-fit ${
        data.image ? "" : "border border-gray-300 rounded-sm"
      }`}
    >
      <div
        className={`${
          data.image ? "w-[142px] h-[180px]" : ""
        }  overflow-hidden rounded-sm`}
      >
        {data.image && (
          <Image
            className="w-full h-full object-cover transition-transform duration-300 ease-out 
            hover:scale-110 hover:rotate-3"
            src={data.image}
            alt="ảnh food&drink"
            width={142}
            height={180}
          />
        )}
      </div>
      <div
        className={`flex flex-col justify-between gap-3 ${
          data.image ? "pr-[50px]" : "pr-[150px]"
        }`}
      >
        <div className="flex gap-1 flex-col">
          <div
            className="text-[16px] font-semibold uppercase hover:text-(--color-yellow)
      hover:cursor-pointer w-fit pr-2"
          >
            {data.name}
          </div>

          <div className="text-[16px] font-semibold">
            {Number(data.price_final).toLocaleString("vi-VN")} VNĐ
          </div>
        </div>

        <div
          className="text-black w-[100px] flex bg-gray-50 items-center justify-between
    rounded-sm font-semibold px-1.5 py-2 hover:bg-(--color-yellow) "
        >
          <FontAwesomeIcon
            className={`${styles.btn_inc_dec}`}
            icon={faMinus}
            onClick={() =>
              setTicketSelected(data.name, data.price_final, false)
            }
          />
          <p>{ticketSelected?.[data.name]?.quantity ?? 0}</p>
          <FontAwesomeIcon
            className={`${styles.btn_inc_dec}`}
            icon={faPlus}
            onClick={() => setTicketSelected(data.name, data.price_final, true)}
          />
        </div>
      </div>
    </div>
  );
}

export default PriceCard;
