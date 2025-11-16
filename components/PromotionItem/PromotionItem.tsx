import Image from "next/image";
import LoadingLink from "../Link/LinkLoading";

function PromotionItem({ image, link = "" }: { image: string; link: string }) {
  console.log(image);
  return (
    <div className="mb-5">
      <LoadingLink href={link}>
        <Image
          src={image}
          width={300}
          height={50}
          alt="Promotion"
          className="rounded-sm"
        />
      </LoadingLink>
    </div>
  );
}

export default PromotionItem;
