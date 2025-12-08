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
      className={`${
        !data.image && "p-2"
      } flex flex-col md:flex-row bg-transparent lg:p-5 gap-2 ${
        data.image
          ? "w-[125px] md:w-[300px]"
          : "border border-gray-300 rounded-sm w-[300px]"
      } `}
    >
      {/* ảnh */}
      <div
        className={`${
          data.image ? "w-[120px] h-[160px] md:w-[142px] md:h-[180px]" : ""
        }  overflow-hidden rounded-sm`}
      >
        {data.image && (
          <Image
            className="w-full h-full object-cover transition-transform duration-300 ease-out 
            hover:scale-110 hover:rotate-3"
            src={data.image}
            alt="ảnh food&drink"
            width={130}
            height={160}
          />
        )}
      </div>
      {/* tên, mô tả */}
      <div
        className={`flex flex-col justify-between gap-3 w-fit min-h-[120px] relative 
          ${data.description && "min-h-[160px]"}`}
      >
        <div className="flex gap-1 flex-col ">
          <div
            className="text-[16px] font-semibold uppercase hover:text-(--color-yellow)
      hover:cursor-pointer w-fit"
          >
            {data.name}
          </div>

          {/* mô tả cho combo */}
          <div className={`${data.description !== null ? "flex" : "hidden"}`}>
            {data.description !== null ? data.description : ""}
          </div>

          <div className="text-[16px] font-semibold">
            {Number(data.price_final).toLocaleString("vi-VN")} VNĐ
          </div>
        </div>

        <div
          className="text-black w-[100px] flex bg-gray-50 items-center justify-between
          rounded-sm font-semibold px-1.5 py-2 hover:bg-(--color-yellow) absolute right-0
          left-0 bottom-0"
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
