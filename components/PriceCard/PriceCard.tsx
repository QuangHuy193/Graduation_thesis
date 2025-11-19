import { faMinus, faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import styles from "./PriceCard.module.scss";

function PriceCard({ data }) {
  return (
    <div
      className="bg-transparent border border-gray-300 rounded-sm p-5 flex flex-col
    justify-between h-full"
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
        <FontAwesomeIcon className={`${styles.btn_inc_dec}`} icon={faMinus} />
        <p>0</p>
        <FontAwesomeIcon className={`${styles.btn_inc_dec}`} icon={faPlus} />
      </div>
    </div>
  );
}

export default PriceCard;
