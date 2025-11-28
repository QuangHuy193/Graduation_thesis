"use client";

import React from "react";
import styles from "./MemberShipInfo.module.scss";

/**
 * MembershipInfo props (optional):
 *  - plans: array of { id, title, subtitle, image, description, perks: string[], ctaText }
 *
 * Example usage:
 * <MembershipInfo plans={[{...}, {...}]} />
 */
export default function MembershipInfo({ plans }) {
    const defaultPlans = [
        {
            id: "cfriend",
            title: "C'FRIEND",
            subtitle: "Được cấp lần đầu khi mua 2 vé xem phim bất kỳ tại Cinestar.",
            image: "/img-card-member2.jpg", // thay đường dẫn ảnh
            perks: [
                "Được giảm 10% trực tiếp trên giá trị hóa đơn bắp nước khi mua tại quầy.",
                "Được tặng 1 vé xem phim 2D vào tuần sinh nhật (tính từ Thứ Hai đến Chủ Nhật) với số điểm tích lũy tối thiểu 500 điểm.",
                "Được tham gia các chương trình dành cho thành viên.",
            ],
            ctaText: "BẠN ĐÃ LÀ THÀNH VIÊN C'FRIEND",
            featured: false,
        },
        {
            id: "cvip",
            title: "C'VIP",
            subtitle: "Được cấp cho thành viên C'Friend khi tích lũy được ít nhất 10,000 điểm.",
            image: "/img-card-vip.jpg",
            perks: [
                "Được giảm 15% trực tiếp trên giá trị hóa đơn bắp nước khi mua tại quầy.",
                "Có cơ hội nhận vé tham gia Lễ Ra Mắt Phim và các chương trình khuyến mãi khác của Cinestar.",
            ],
            ctaText: "TÌM HIỂU C'VIP",
            featured: true,
        },
    ];

    const items = plans && plans.length ? plans : defaultPlans;

    return (
        <section className={styles.wrapper} aria-label="Membership plans">
            <h2 className={styles.header}>ĐĂNG KÝ THÀNH VIÊN</h2>

            <div className={styles.grid}>
                {items.map((p) => (
                    <article
                        key={p.id}
                        className={`${styles.card} ${p.featured ? styles.featured : ""}`}
                    >
                        <div className={styles.media}>
                            <img
                                src={p.image}
                                alt={p.title}
                                className={styles.mediaImg}
                                onError={(e) => {
                                    e.currentTarget.src =
                                        "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='180'%3E%3Crect width='100%25' height='100%25' fill='%23333'/%3E%3Ctext x='50%25' y='50%25' fill='%23fff' font-size='20' font-family='Arial' dominant-baseline='middle' text-anchor='middle'%3ENo image%3C/text%3E%3C/svg%3E";
                                }}
                            />
                        </div>

                        <div className={styles.body}>
                            <h3 className={styles.title}>{p.title}</h3>
                            <p className={styles.subtitle}>{p.subtitle}</p>

                            {/* <p className={styles.desc}>{p.description}</p> */}

                            <ul className={styles.perks}>
                                {p.perks.map((perk, idx) => (
                                    <li key={idx} className={styles.perkItem}>
                                        <span className={styles.bullet} />
                                        <span>{perk}</span>
                                    </li>
                                ))}
                            </ul>

                            <div className={styles.ctaWrap}>
                                <button
                                    type="button"
                                    className={`${styles.cta} ${p.featured ? styles.ctaPrimary : ""}`}
                                >
                                    {p.ctaText}
                                </button>
                            </div>
                        </div>
                    </article>
                ))}

            </div>
        </section>
    );
}
