import Image from "next/image";
import Link from "next/link";

function PromotionItem({ image, link = "" }: { image: string; link: string }) {
  console.log(image);
  return (
    <div className="mb-5">
      <Link href={link}>
        <Image
          src={image}
          width={300}
          height={50}
          alt="Promotion"
          className="rounded-sm"
        />
      </Link>
    </div>
  );
}

export default PromotionItem;
