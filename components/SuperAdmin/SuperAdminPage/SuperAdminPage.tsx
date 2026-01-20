"use client";
import { MENUSUPERADMIN } from "@/lib/constant";
import { useEffect, useRef, useState } from "react";
import RevenueChart from "../RevenueChart/RevenueChart";
import PromotionTable, {
  PromotionRule,
} from "@/components/PromotionTable/PromotionTable";
import { getAllPromotions } from "@/lib/axios/admin/promotion_ruleAPI";
import { useSession } from "next-auth/react";
import styles from "./SuperAdminPage.module.scss";
import ItemRevenue from "../ItemRevenue/ItemRevenue";
import ShowtimeAudit from "../ShowtimeAudit/ShowtimeAudit";
import { getAllUsers } from "@/lib/axios/admin/userAPI";
import UserTable from "@/components/UserTable/UserTable";

function SuperAdminPage() {
  const [state, setState] = useState({
    pageTitle: 0,
    selected: {
      type: "month",
      month: new Date().getMonth() + 1, // 1–12
      year: new Date().getFullYear(),
    },
  });
  const { data: session } = useSession();
  const user = session?.user;
  //Lấy khuyến mãi
  const [promotions, setPromotions] = useState<PromotionRule[]>([]);
  const [users, setUsers] = useState([]);
  const loaded = useRef({
    promotions: false,
    users: false,
  });
  async function fetchPromotion() {
    try {
      const data = await getAllPromotions();
      setPromotions(data);
    } catch (error) {
      console.error(error);
      setPromotions([]);
    }
  }
  function handleEditUser() {
    fetchUsers();
  }
  async function fetchUsers() {
    try {
      const data = await getAllUsers();
      setUsers(data);
    } catch (error) {
      setUsers([]);
    }
  }
  function handleReloadPromotion() {
    fetchPromotion();
  }
  useEffect(() => {
    if (state.pageTitle === 2 && !loaded.current.promotions) {
      fetchPromotion();
      loaded.current.promotions = true;
    }
  }, [state.pageTitle]);
  useEffect(() => {
    if (state.pageTitle === 3 && !loaded.current.users) {
      fetchUsers();
      loaded.current.users = true;
    }
  }, [state.pageTitle])
  return (
    <div className="flex h-[515px] relative bg-gray-50 rounded-md">
      {/* ASIDE */}
      <aside
        className="absolute left-0 top-0 h-[515px] w-(--width-sidebar-sadmin)
       bg-gray-900 text-gray-200 p-4 shadow-lg flex flex-col gap-3
       rounded-tl-md rounded-bl-md"
      >
        <div className="text-lg font-bold text-white mb-3 tracking-wide">
          TRANG THỐNG KÊ
        </div>

        {MENUSUPERADMIN.map((m) => (
          <div
            key={m.index}
            onClick={() =>
              setState((prev) => ({ ...prev, pageTitle: m.index }))
            }
            className={`
                px-3 py-2 rounded-md  cursor-pointer transition-all
                ${state.pageTitle === m.index
                ? "bg-blue-600 text-white"
                : "hover:bg-gray-700"
              }
              `}
          >
            {m.title}
          </div>
        ))}
      </aside>

      {/* RIGHT AREA */}
      <div className="flex-1 ml-(--width-sidebar-sadmin) flex flex-col min-h-screen">
        {/* HEADER */}
        <header
          className="relative top-0 right-0 left-0 h-16 bg-white 
        shadow-md flex items-center px-6 justify-between border-b rounded-tr-lg"
        >
          <div className="text-xl font-semibold text-gray-800">
            {MENUSUPERADMIN[state.pageTitle].title}
          </div>
          <div className="text-gray-600 font-medium tracking-wide">
            CHỦ CÔNG TY
          </div>
        </header>

        {/* CONTENT */}
        <main className="p-3 flex-1 overflow-y-auto ">
          <div
            className="overflow-y-scroll h-[calc(500px-70px)] bg-white shadow rounded-lg p-4 
            scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 text-black"
          >
            {state.pageTitle === 0 && (
              <div className="pb-1">
                {/* biểu đồ */}
                <RevenueChart
                  selected={state.selected}
                  setType={(type) => {
                    setState((prev) => ({
                      ...prev,
                      selected: {
                        ...prev.selected,
                        type,
                      },
                    }));
                  }}
                  setSelected={(key, value) => {
                    setState((prev) => ({
                      ...prev,
                      selected: {
                        ...prev.selected,
                        [key]: value,
                      },
                    }));
                  }}
                />

                <div className={styles.div_line}>
                  <span>📊</span>
                </div>

                {/* doanh thu phim */}
                <ItemRevenue
                  selected={state.selected}
                  itemType="movie"
                  itemTitle="Doanh thu phim"
                  itemSubTitle="Phim"
                />
                <div className={styles.div_line}>
                  <span>📊</span>
                </div>

                {/* doanh thu rạp */}
                <ItemRevenue
                  selected={state.selected}
                  itemType="cinema"
                  itemTitle="Doanh thu rạp"
                  itemSubTitle="Rạp"
                />
              </div>
            )}
            {state.pageTitle === 1 && <ShowtimeAudit />}
            {state.pageTitle === 2 && (
              <div className="mt-4">
                <PromotionTable
                  promotion={promotions}
                  onEdit={handleReloadPromotion}
                  onAdd={handleReloadPromotion}
                  user={user}
                />
              </div>
            )}
            {
              state.pageTitle === 3 && (
                <div className="mt-4">
                  <UserTable users={users} onEdit={handleEditUser} />
                </div>
              )
            }
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-gray-300" />
              <div className="text-center text-sm text-gray-400 italic">
                Đã hiển thị toàn bộ dữ liệu
              </div>
              <div className="flex-1 h-px bg-gray-300" />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default SuperAdminPage;
