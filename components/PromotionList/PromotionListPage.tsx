"use client";
import { getPromotionsAPI } from "@/lib/axios/promotionAPI";
import { useEffect, useState } from "react";
import PromotionItemWithName from "../PromotionItem/PromotionItemWithName";

function PromotionListPage() {
  const [promotions, setPromotionList] = useState([]);

  useEffect(() => {
    const getPromotionList = async () => {
      try {
        const res = await getPromotionsAPI();
        setPromotionList(res);
      } catch (error) {
        console.log(error);
      }
    };
    getPromotionList();
  }, []);
  return (
    <div>
      {promotions.length !== 0 &&
        promotions.map((p, ind) => (
          <div key={ind}>
            <PromotionItemWithName data={p} index={ind} />
          </div>
        ))}
    </div>
  );
}

export default PromotionListPage;
