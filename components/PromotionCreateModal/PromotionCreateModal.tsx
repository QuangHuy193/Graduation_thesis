import React from "react";

type Props = {
    open: boolean;
    onClose: () => void;
    onSubmit: (payload: any) => void;
};

export default function PromotionCreateModal({
    open,
    onClose,
    onSubmit,
}: Props) {
    if (!open) return null;

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = new FormData(e.currentTarget);

        const payload = {
            name: form.get("name"),
            image: form.get("image"),
            start_time: form.get("start_time") || null,
            end_time: form.get("end_time") || null,
            priority: Number(form.get("priority") || 1),
            enable: form.get("enable") ? 1 : 0,
            display: form.get("display") ? 1 : 0,
            isHoliday: form.get("isHoliday") ? 1 : 0,
            description: form.get("description"),
        };

        onSubmit(payload);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl overflow-hidden">

                {/* ===== Header ===== */}
                <div className="px-5 py-4 border-b flex items-center justify-between">
                    <h3 className="text-lg font-semibold">🎁 Thêm chương trình khuyến mãi</h3>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600"
                    >
                        ✕
                    </button>
                </div>

                {/* ===== Form ===== */}
                <form
                    onSubmit={handleSubmit}
                    className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm"
                >
                    {/* Tên */}
                    <div className="md:col-span-2">
                        <label className="block text-xs text-slate-500 mb-1">
                            Tên chương trình *
                        </label>
                        <input
                            name="name"
                            required
                            className="w-full border rounded-lg px-3 py-2"
                            placeholder="Ví dụ: Giảm giá cuối tuần"
                        />
                    </div>

                    {/* Ảnh */}
                    <div className="md:col-span-2">
                        <label className="block text-xs text-slate-500 mb-1">
                            Ảnh (URL)
                        </label>
                        <input
                            name="image"
                            className="w-full border rounded-lg px-3 py-2"
                            placeholder="https://..."
                        />
                    </div>

                    {/* Thời gian */}
                    <div>
                        <label className="block text-xs text-slate-500 mb-1">
                            Ngày bắt đầu
                        </label>
                        <input
                            type="datetime-local"
                            name="start_time"
                            className="w-full border rounded-lg px-3 py-2 cursor-pointer"
                        />
                    </div>

                    <div>
                        <label className="block text-xs text-slate-500 mb-1">
                            Ngày kết thúc
                        </label>
                        <input
                            type="datetime-local"
                            name="end_time"
                            className="w-full border rounded-lg px-3 py-2 cursor-pointer"
                        />
                    </div>

                    {/* Priority */}
                    <div>
                        <label className="block text-xs text-slate-500 mb-1">
                            Độ ưu tiên
                        </label>
                        <select
                            name="priority"
                            defaultValue={1}
                            className="w-full border rounded-lg px-3 py-2 cursor-pointer"
                        >
                            <option value={1}>1 - Cao nhất</option>
                            <option value={2}>2</option>
                            <option value={3}>3</option>
                            <option value={4}>4</option>
                            <option value={5}>5 - Thấp nhất</option>
                        </select>
                    </div>

                    {/* Switch */}
                    <div className="flex items-center gap-4 mt-6">
                        <label className="flex items-center gap-2">
                            <input type="checkbox" name="enable" defaultChecked />
                            <span>Kích hoạt</span>
                        </label>

                        <label className="flex items-center gap-2">
                            <input type="checkbox" name="display" defaultChecked />
                            <span>Hiển thị</span>
                        </label>

                        <label className="flex items-center gap-2">
                            <input type="checkbox" name="isHoliday" />
                            <span>Ngày lễ</span>
                        </label>
                    </div>

                    {/* Mô tả */}
                    <div className="md:col-span-2">
                        <label className="block text-xs text-slate-500 mb-1">
                            Mô tả
                        </label>
                        <textarea
                            name="description"
                            rows={3}
                            className="w-full border rounded-lg px-3 py-2"
                            placeholder="Mô tả chi tiết chương trình..."
                        />
                    </div>

                    {/* Footer */}
                    <div className="md:col-span-2 flex justify-end gap-2 pt-4 border-t">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border rounded-lg text-sm cursor-pointer"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 cursor-pointer"
                        >
                            Lưu CTKM
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
