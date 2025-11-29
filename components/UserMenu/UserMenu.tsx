"use client";

import styles from "./UserMenu.module.scss"
import LoadingLink from "../Link/LinkLoading";  // chỉnh path theo dự án của bạn
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faRightFromBracket } from "@fortawesome/free-solid-svg-icons";
import { useRouter } from "next/navigation";
export default function UserMenu({ user, handleLogout }) {
    const router = useRouter();
    return (
        <>
            {user ? (
                <div className="relative group flex items-center gap-2">
                    <span className="font-medium text-(--color-yellow) cursor-pointer select-none overflow">
                        {user.name}
                    </span>
                    <div
                        className="absolute right-0 top-full mt-1 bg-gray-800 rounded shadow-md
                        opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0
                        transition-all duration-300 min-w-[180px] z-50"
                    ><LoadingLink
                        href="/user-info"
                        className={styles.InfoBtn}
                    >
                            <FontAwesomeIcon icon={faUser} className={styles.icon} />{" "}
                            Thông tin cá nhân
                        </LoadingLink>
                        {/* <button className={styles.InfoBtn} onClick={() => (router.push("/user-info"))}>
                        
                        </button> */}
                        <button onClick={handleLogout} className={styles.logoutBtn}>
                            <FontAwesomeIcon icon={faRightFromBracket} className={styles.icon} />{" "}
                            Đăng xuất
                        </button>
                    </div>
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
