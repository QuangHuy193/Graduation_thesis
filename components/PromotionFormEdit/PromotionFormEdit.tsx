import { useState } from "react";
import Swal from "sweetalert2";
import { PromotionRule } from "../PromotionTable/PromotionTable";
import { updatePromotion } from "@/lib/axios/admin/promotion_ruleAPI";
// import { updatePromotion } from "@/lib/axios/promotionAPI";

type Props = {
    promotion: PromotionRule;
    onSaved: () => void;
    onCancel?: () => void;
};

export default function PromotionForm({ promotion, onSaved, onCancel }: Props) {
    const [form, setForm] = useState<PromotionRule>({ ...promotion });
    const [loading, setLoading] = useState(false);
    const [isUnlimited, setIsUnlimited] = useState(
        !form.start_time && !form.end_time
    );

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setForm((prev) => ({
            ...prev,
            [name]:
                e.target.type === "checkbox"
                    ? (e.target as HTMLInputElement).checked
                        ? 1
                        : 0
                    : value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            setLoading(true);
            //Gọi api update
            await updatePromotion(form.rule_id, {
                name: form.name,
                image: form.image,
                start_time: isUnlimited ? null : form.start_time,
                end_time: isUnlimited ? null : form.end_time,
                priority: Number(form.priority),
                // enable: Number(form.enable),
                display: Number(form.display),
                description: form.description,
                isHoliday: Number(form.isHoliday),

            });

            Swal.fire({
                icon: "success",
                title: "Đã lưu",
                timer: 1200,
                showConfirmButton: false,
            });

            onSaved?.();
        } catch (err) {
            console.error(err);
            Swal.fire("Lỗi", "Không thể cập nhật promotion", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="space-y-4 bg-white p-4 rounded border"
        >
            {/* Tên */}
            <div>
                <label className="block text-sm font-medium">Tên chương trình</label>
                <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    className="w-full border px-3 py-2 rounded text-sm"
                    required
                />
            </div>

            {/* Hình ảnh */}
            <div>
                <label className="block text-sm font-medium">Ảnh (URL)</label>
                <input
                    name="image"
                    value={form.image ?? ""}
                    onChange={handleChange}
                    className="w-full border px-3 py-2 rounded text-sm"
                />
            </div>

            {/* Thời gian */}
            <div className="space-y-2">
                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        id="unlimited"
                        checked={isUnlimited}
                        onChange={(e) => {
                            const checked = e.target.checked;
                            setIsUnlimited(checked);

                            setForm((prev) => ({
                                ...prev,
                                start_time: checked ? null : prev.start_time,
                                end_time: checked ? null : prev.end_time,
                            }));
                        }}
                    />
                    <label htmlFor="unlimited" className="text-sm">
                        Hiệu lực vô thời hạn
                    </label>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-sm font-medium">Bắt đầu</label>
                        <input
                            type="datetime-local"
                            name="start_time"
                            value={form.start_time?.slice(0, 16) ?? ""}
                            onChange={handleChange}
                            disabled={isUnlimited}
                            className="w-full border px-3 py-2 rounded text-sm disabled:bg-gray-100"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium">Kết thúc</label>
                        <input
                            type="datetime-local"
                            name="end_time"
                            value={form.end_time?.slice(0, 16) ?? ""}
                            onChange={handleChange}
                            disabled={isUnlimited}
                            className="w-full border px-3 py-2 rounded text-sm disabled:bg-gray-100"
                        />
                    </div>
                </div>
            </div>


            {/* Ưu tiên */}
            <div>
                <label className="block text-sm font-medium">Độ ưu tiên</label>
                <select
                    name="priority"
                    value={form.priority}
                    onChange={handleChange}
                    className="w-full border px-3 py-2 rounded text-sm"
                >
                    {[1, 2, 3, 4, 5].map((p) => (
                        <option key={p} value={p}>
                            {p}
                        </option>
                    ))}
                </select>
            </div>

            {/* Trạng thái */}
            <div className="flex gap-6">
                {/* <label className="flex items-center gap-2 text-sm">
                    <input
                        type="checkbox"
                        name="enable"
                        checked={form.enable === 1}
                        onChange={handleChange}
                    />
                    Kích hoạt
                </label> */}

                <label className="flex items-center gap-2 text-sm">
                    <input
                        type="checkbox"
                        name="display"
                        checked={form.display === 1}
                        onChange={handleChange}
                    />
                    Hiển thị
                </label>

                <label className="flex items-center gap-2 text-sm">
                    <input
                        type="checkbox"
                        name="isHoliday"
                        checked={form.isHoliday === 1}
                        onChange={handleChange}
                    />
                    Ngày lễ
                </label>
            </div>

            {/* Mô tả */}
            <div>
                <label className="block text-sm font-medium">Mô tả</label>
                <textarea
                    name="description"
                    value={form.description ?? ""}
                    onChange={handleChange}
                    className="w-full border px-3 py-2 rounded text-sm"
                    rows={6}
                />
            </div>

            {/* Action */}
            <div className="flex justify-end gap-2 mt-4">
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={loading}
                    className="px-4 py-2 border rounded text-sm cursor-pointer"
                >
                    Hủy
                </button>

                <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded text-sm cursor-pointer"
                >
                    Lưu
                </button>
            </div>

        </form>
    );
}
