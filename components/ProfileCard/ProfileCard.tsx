"use client";

import React from "react";
import styles from "./ProfileCard.module.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faCircleUser,
    faPen,
    faStar,
    faHistory,
    faUser,
    faRightFromBracket,
    faShieldAlt,
} from "@fortawesome/free-solid-svg-icons";

/**
 * props:
 *  - user: { name: string, points: number, pointsGoal: number, tier?: string }
 *  - onEditAvatar: () => void
 *  - onViewProfile: () => void
 *  - onLogout: () => void
 */
export default function ProfileCard({
    user = { name: "Người Dùng", points: 0, pointsGoal: 10000, tier: "C'Friends" },
    onEditAvatar,
    onViewProfile,
    onLogout,
}) {
    const progress = Math.max(
        0,
        Math.min(1, (user.points ?? 0) / (user.pointsGoal ?? 10000))
    );

    return (
        <aside className={styles.card} aria-label="Profile card">
            <div className={styles.header}>
                <div className={styles.avatarWrap}>
                    <div className={styles.avatar}>
                        <FontAwesomeIcon icon={faCircleUser} className={styles.avatarIcon} />
                        <button
                            className={styles.editAvatar}
                            onClick={onEditAvatar}
                            aria-label="Thay đổi ảnh đại diện"
                        >
                            <FontAwesomeIcon icon={faPen} />
                        </button>
                    </div>
                </div>

                <div className={styles.userInfo}>
                    <div className={styles.name}>{user.name}</div>
                    <button className={styles.editProfile} onClick={onViewProfile}>
                        Thay đổi ảnh đại diện
                    </button>
                </div>
            </div>

            <div className={styles.tierWrap}>
                <div className={styles.tierBtn}>{user.tier}</div>
            </div>

            <div className={styles.pointsWrap}>
                <div className={styles.pointsLabel}>
                    Tích điểm <span className={styles.tierInline}>{user.tier}</span>
                </div>

                <div className={styles.progressBar}>
                    <div
                        className={styles.progressFill}
                        style={{ width: `${Math.round(progress * 100)}%` }}
                        aria-hidden="true"
                    />
                </div>

                <div className={styles.pointsText}>
                    <span className={styles.pointsNow}>{user.points ?? 0}</span>/
                    <span className={styles.pointsGoal}>{user.pointsGoal ?? 10000}K</span>
                </div>
            </div>

            <hr className={styles.sep} />

            <nav className={styles.menu}>
                <button className={styles.menuItem}>
                    <span className={styles.menuIcon}><FontAwesomeIcon icon={faUser} /></span>
                    Thông tin khách hàng
                </button>

                <button className={styles.menuItem}>
                    <span className={styles.menuIcon}><FontAwesomeIcon icon={faStar} /></span>
                    Thành viên {user.tier}
                </button>

                <button className={styles.menuItem}>
                    <span className={styles.menuIcon}><FontAwesomeIcon icon={faHistory} /></span>
                    Lịch sử mua hàng
                </button>

                <hr className={styles.sepLight} />

                <button className={`${styles.menuItem} ${styles.logout}`} onClick={onLogout}>
                    <span className={styles.menuIcon}><FontAwesomeIcon icon={faRightFromBracket} /></span>
                    Đăng xuất
                </button>
            </nav>
        </aside>
    );
}
