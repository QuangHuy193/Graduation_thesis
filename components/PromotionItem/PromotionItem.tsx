import Image from "next/image";

function PromotionItem({ image }: { image: string }) {
  console.log(image);
  return (
    <div>
      <Image src={image} width={120} height={30} alt="Promotion" />
    </div>
  );
}

export default PromotionItem;
