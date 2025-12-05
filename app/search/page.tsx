"use client";
import SearchPage from "@/components/SearchPage/SearchPage";
import { useSearchParams } from "next/navigation";

export default function Search() {
  const searchParams = useSearchParams();
  const keyword = searchParams.get("keyword") || "";
  return (
    <div>
      <SearchPage keyword={keyword} />
    </div>
  );
}
