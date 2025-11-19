// app/upload/page.tsx
"use client";

import styles from "./page.module.scss";
import UploadForm from "@/components/UploadForm/UploadForm";


export default function UploadPage() {
    return (
        <main className={styles.page}>
            {/* Header spacer (giữ vị trí header nếu bạn có header global) */}
            <div className={styles.spacer} />

            <div className={styles.container}>
                <div className={styles.card}>
                    <div className={styles.headerRow}>
                        <div>
                            <h1 className={styles.title}>Upload ảnh</h1>
                            <p className={styles.description}>
                                Chọn ảnh, thêm caption và lưu vào database. Hỗ trợ Cloudinary + MySQL.
                            </p>
                        </div>

                        <div className={styles.badges}>
                            <div className={`${styles.badge}`} style={{ background: "#eef2ff", color: "#4f46e5" }}>
                                An toàn
                            </div>
                            <div className={`${styles.badge}`} style={{ background: "#ecfdf5", color: "#047857" }}>
                                Lưu vào MySQL
                            </div>
                        </div>
                    </div>

                    <div className={styles.grid}>
                        <div className={styles.left}>
                            <div className={styles.cardPanel}>
                                <h3 className={styles.smallTitle}>Hướng dẫn</h3>
                                <ul className={styles.smallText}>
                                    <li>• Chỉ tải ảnh (jpg, png, webp).</li>
                                    <li>• Ảnh sẽ upload lên Cloudinary và lưu URL vào DB.</li>
                                    <li>• Nếu cần bảo mật, thêm authentication cho API.</li>
                                    <li>• Bạn có thể xem gallery tại /gallery (nếu có).</li>
                                </ul>
                            </div>

                            <div className={styles.cardPanel}>
                                <h3 className={styles.smallTitle}>Mẹo</h3>
                                <p className={styles.smallText}>
                                    Muốn tối ưu hiển thị? Dùng transformation của Cloudinary để crop/resize
                                    trước khi hiển thị bằng <code>next/image</code>.
                                </p>
                            </div>
                        </div>

                        <div className={styles.right}>
                            <UploadForm />
                        </div>
                    </div>
                </div>
            </div>

            <div className={styles.footerNote}>
                <span>© {new Date().getFullYear()} — Built with Cloudinary & MySQL</span>
            </div>
        </main>
    );
}