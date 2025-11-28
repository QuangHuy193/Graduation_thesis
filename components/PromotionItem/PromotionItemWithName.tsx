import Image from "next/image";
import Button from "../Button/Button";

function PromotionItemWithName({ data, index }) {
  return (
    <div className="flex gap-4 pb-20">
      {index % 2 === 0 && (
        <div className="flex-1">
          <Image
            className="w-full"
            src={data.image}
            alt="promotion"
            width={120}
            height={50}
          />
        </div>
      )}

      <div className="flex-1">
        <h1 className="font-bold text-xl pb-4">{data.name}</h1>
        <div className="pb-4">{data.description}</div>
        <div>
          <Button text="ĐẶT VÉ NGAY" link="/movie" p_l_r="80px" />
        </div>
      </div>

      {index % 2 !== 0 && (
        <div className="flex-1">
          <Image
            className="w-full"
            src={data.image}
            alt="promotion"
            width={120}
            height={50}
          />
        </div>
      )}
    </div>
  );
}

export default PromotionItemWithName;
