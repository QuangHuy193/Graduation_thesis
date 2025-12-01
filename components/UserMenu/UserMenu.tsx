"use client";

import styles from "./UserMenu.module.scss"
import LoadingLink from "../Link/LinkLoading";  // chỉnh path theo dự án của bạn
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faRightFromBracket, faBlackboard } from "@fortawesome/free-solid-svg-icons";
import { useRouter } from "next/navigation";

export default function UserMenu({ user, handleLogout }) {
    const router = useRouter();
    return (
        <>
            {user ? (
                <div className="relative flex items-center gap-2">
                    <span className="font-medium text-(--color-yellow) cursor-pointer select-none group">
                        {user.name}
                        <div
                            className="absolute right-0 top-full mt-1 bg-gray-800 rounded shadow-md
            opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0
            transition-all duration-300 min-w-[180px] z-50 pointer-events-none group-hover:pointer-events-auto"
                        >
                            <LoadingLink
                                href="/user-info"
                                className={styles.InfoBtn}
                            >
                                <FontAwesomeIcon icon={faUser} className={styles.icon} />{" "}
                                Thông tin cá nhân
                            </LoadingLink>
                            <LoadingLink href="/admin" className={styles.InfoBtn}>
                                <FontAwesomeIcon icon={faBlackboard} className={styles.icon} />{" "}
                                Dashboard
                            </LoadingLink>
                            <button onClick={handleLogout} className={styles.logoutBtn}>
                                <FontAwesomeIcon icon={faRightFromBracket} className={styles.icon} />{" "}
                                Đăng xuất
                            </button>
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
