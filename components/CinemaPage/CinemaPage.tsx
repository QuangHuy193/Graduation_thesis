"use client";
import { useState } from "react";
import styles from "./CinemaPage.module.scss";

function CinemaPage() {
  const [state, setState] = useState({
    tab: 0,
  });
  return (
    <div>
      {/* tab */}
      <div className="flex bg-linear-to-r from-[#3C2B63] via-[#0F172B] to-[#131E3A">
        <div
          className={`${styles.tab_item} ${
            state.tab === 0 ? "text-(--color-yellow)" : ""
          }`}
          onClick={() => setState((prev) => ({ ...prev, tab: 0 }))}
        >
          PHIM ĐANG CHIẾU
          {state.tab === 0 && <span></span>}
        </div>
        <div
          className={`${styles.tab_item} ${
            state.tab === 1 ? "text-(--color-yellow)" : ""
          }`}
          onClick={() => setState((prev) => ({ ...prev, tab: 1 }))}
        >
          PHIM SẮP CHIẾU{state.tab === 1 && <span></span>}
        </div>
        <div
          className={`${styles.tab_item} ${
            state.tab === 2 ? "text-(--color-yellow)" : ""
          }`}
          onClick={() => setState((prev) => ({ ...prev, tab: 2 }))}
        >
          BẢNG GIÁ VÉ{state.tab === 2 && <span></span>}
        </div>
      </div>
    </div>
  );
}

export default CinemaPage;
