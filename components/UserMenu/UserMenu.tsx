"use client";

import styles from "./UserMenu.module.scss";
import LoadingLink from "../Link/LinkLoading"; // chỉnh path theo dự án của bạn
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faRightFromBracket,
  faBlackboard,
  faChartLine,
} from "@fortawesome/free-solid-svg-icons";
import { useSession } from "next-auth/react";

export default function UserMenu({ user, handleLogout }) {
  const { data: session, status } = useSession();
  const role = session?.user?.role ?? user?.role ?? "user";
  return (
    <>
      {user ? (
        <div className="relative flex items-center gap-2">
          <span className="font-medium text-(--color-yellow) cursor-pointer select-none group relative">
            {user.name}
            <div className="absolute right-0 top-full pt-2 pointer-events-none group-hover:pointer-events-auto">
              <div
                className="bg-gray-800 rounded shadow-md
                 opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0
                 transition-all duration-300 min-w-[180px] z-50
                 pointer-events-none group-hover:pointer-events-auto"
              >
                <LoadingLink href="/user-info" className={styles.InfoBtn}>
                  <FontAwesomeIcon icon={faUser} className={styles.icon} />{" "}
                  Thông tin cá nhân
                </LoadingLink>

                {role === "admin" && (
                  <LoadingLink href="/admin" className={styles.InfoBtn}>
                    <FontAwesomeIcon
                      icon={faBlackboard}
                      className={styles.icon}
                    />{" "}
                    Trang quản trị
                  </LoadingLink>
                )}

                {role === "superadmin" && (
                  <LoadingLink href="/sadmin" className={styles.InfoBtn}>
                    <FontAwesomeIcon
                      icon={faChartLine}
                      className={styles.icon}
                    />{" "}
                    Trang Thống kê
                  </LoadingLink>
                )}

                <button onClick={handleLogout} className={styles.logoutBtn}>
                  <FontAwesomeIcon
                    icon={faRightFromBracket}
                    className={styles.icon}
                  />{" "}
                  Đăng xuất
                </button>
              </div>
            </div>
          </span>
        </div>
      ) : (
        <LoadingLink
          href="/login"
          className="cursor-pointer hover:text-(--color-yellow)"
        >
          Đăng nhập
        </LoadingLink>
      )}
    </>
  );
}
