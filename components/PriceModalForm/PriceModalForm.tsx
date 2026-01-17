import React, { useState, useEffect } from "react";
import styles from "./PriceModalForm.module.scss";
import { updatePrice } from "@/lib/axios/admin/showtimeAPI";
import Swal from "sweetalert2";
interface PriceModalFormProps {
    isOpen: boolean;
    currentId?: number | null;
    currentPriceNormal?: number;
    currentPriceStudent?: number;
    onClose: () => void;
    onSave: () => void;
}

const PriceModalForm: React.FC<PriceModalFormProps> = ({
    isOpen,
    currentPriceNormal,
    currentPriceStudent,
    currentId,
    onClose,
    onSave,
}) => {
    const [showtimeId, setShowtimeId] = useState<number | null>(null);
    const [priceNormal, setPriceNormal] = useState<string>("");
    const [priceStudent, setPriceStudent] = useState<string>("");
    useEffect(() => {
        if (currentId !== null) {
            setShowtimeId(currentId);
        }
    }, [currentId])
    useEffect(() => {
        if (currentPriceNormal !== undefined) {
            setPriceNormal(String(parseInt(currentPriceNormal.toString(), 10)));
        }
    }, [currentPriceNormal]);
    useEffect(() => {
        if (currentPriceStudent !== undefined) {
            setPriceStudent(String(parseInt(currentPriceStudent.toString(), 10)));
        }
    }, [currentPriceStudent])
    if (!isOpen) return null;
    async function handleSave() {
        if (!showtimeId) return;
        try {
            const res = await updatePrice(showtimeId, { normal: Number(priceNormal), student: Number(priceStudent) });
            if (res.success) {
                await Swal.fire({
                    icon: "success",
                    title: "Lưu thành công",
                    text: "Giá vé đã được cập nhật",
                    timer: 1500,
                    showConfirmButton: false,
                });

                onSave();    // refresh parent
            }
        } catch (error) {
            console.log(`Lỗi khi cập nhật giá`);
        }
    }
    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modal}>
                <h2>Chỉnh sửa giá</h2>
                <label>Người thường</label>
                <input
                    type="number"
                    value={priceNormal}
                    onChange={(e) => setPriceNormal(e.target.value)}
                    className={styles.priceInput}
                />
                <label>HS-SV</label>
                <input
                    type="number"
                    value={priceStudent}
                    onChange={(e) => setPriceStudent(e.target.value)}
                    className={styles.priceInput}
                />
                <div className={styles.buttonGroup}>
                    <button onClick={onClose} className={styles.btnCancel}>
                        Hủy
                    </button>
                    <button
                        onClick={handleSave}
                        className={styles.btnSave}
                    >
                        Lưu
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PriceModalForm;
