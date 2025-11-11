"use client";

import WatchTrailer from "@/components/Button/WatchTrailer";

export default function Home() {
  return (
    <div>
      <div className="px-10 bg-[linear-gradient(180deg,var(--color-blue-black)_0%,#2b3b5e_100%)] ">
        <div className="h-(--width-header)"></div>
        <div>
          <WatchTrailer size={"s"} />
        </div>
      </div>
    </div>
  );
}
