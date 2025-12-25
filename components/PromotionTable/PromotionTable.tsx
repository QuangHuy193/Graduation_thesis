"use client";
import React, { useEffect, useState } from "react";
import { togglePromotionEnable } from "@/lib/axios/admin/promotion_ruleAPI";
import Spinner from "../Spinner/Spinner";
export type PromotionRule = {
    rule_id: number;
    name: string;
    image?: string | null;
    start_time?: string | null;
    end_time?: string | null;
    priority: number;
    enable: number;
    display?: number | null;
    description?: string | null;
    isHoliday?: number | null;
};
type Props = {
    promotion: PromotionRule[],
    onEdit: () => void;
}
// 🔹 MOCK DATA

function PromotionTable({ promotion, onEdit }: Props) {
    const [activeTab, setActiveTab] = useState<"holiday" | "promotion">("promotion");
    const [dataList, setDatalist] = useState<PromotionRule[]>([]);
    const [loading, setLoading] = useState(false);
    const holidayList = dataList.filter((p) => p.isHoliday === 1);
    const promotionList = dataList.filter((p) => !p.isHoliday);

    const dataToShow =
        activeTab === "promotion" ? promotionList : holidayList;
    useEffect(() => { setDatalist(promotion) }, [promotion]);
    async function handleDisable(id: number) {
        try {
            setLoading(true);
            const res = await togglePromotionEnable(id);
            const newEnable = res.data.enable;
            setDatalist(prev =>
                prev.map(item =>
                    item.rule_id === id
                        ? { ...item, enable: newEnable }
                        : item
                )
            );
        } catch (error) {
            console.error(error);
            alert("Vô hiệu / kích hoạt thất bại");
        } finally {
            setLoading(false);
        }
    }
    const renderTable = (data: PromotionRule[]) => (
        <table className="w-full border border-gray-200 rounded-lg overflow-hidden text-sm">
            <thead className="bg-gray-50">
                <tr>
                    <th className="px-3 py-2 text-left font-semibold text-gray-700">
                        Tên
                    </th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-700">
                        Thời gian
                    </th>
                    <th className="px-3 py-2 text-center font-semibold text-gray-700">
                        Độ ưu tiên
                    </th>
                    <th className="px-3 py-2 text-center font-semibold text-gray-700">
                        Trạng thái
                    </th>
                    <th className="px-3 py-2 text-center font-semibold text-gray-700">
                        Hiển thị
                    </th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-700">
                        Mô tả
                    </th>
                    <th className="px-3 py-2 text-center font-semibold text-gray-700">
                        Hành động
                    </th>
                </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
                {data.length === 0 && (
                    <tr>
                        <td colSpan={7} className="px-4 py-6 text-center text-gray-400">
                            Không có dữ liệu
                        </td>
                    </tr>
                )}

                {data.map((item) => (
                    <tr
                        key={item.rule_id}
                        className="hover:bg-gray-50 transition"
                    >
                        {/* Tên */}
                        <td className="px-3 py-2 font-medium text-gray-800">
                            {item.name}
                        </td>

                        {/* Thời gian */}
                        <td className="px-3 py-2 text-gray-600">
                            <div>{item.start_time || "Không thời hạn"}</div>
                            <div className="text-xs text-gray-400">
                                {item.end_time}
                            </div>
                        </td>

                        {/* Priority */}
                        <td className="px-3 py-2 text-center">
                            <span className="inline-block min-w-[28px] rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold">
                                {item.priority}
                            </span>
                        </td>

                        {/* Enable */}
                        <td className="px-3 py-2 text-center">
                            {item.enable ? (
                                <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                                    Bật
                                </span>
                            ) : (
                                <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                                    Tắt
                                </span>
                            )}
                        </td>

                        {/* Display */}
                        <td className="px-3 py-2 text-center">
                            {item.display ? (
                                <span className="text-green-600 font-medium">Có</span>
                            ) : (
                                <span className="text-gray-400">Không</span>
                            )}
                        </td>

                        {/* Description */}
                        <td className="px-3 py-2 text-gray-600 max-w-[260px] truncate">
                            {item.description || "—"}
                        </td>

                        {/* Actions */}
                        <td className="px-3 py-2 text-center whitespace-nowrap">
                            <button className="mr-2 rounded border px-3 py-1 text-xs font-medium hover:bg-gray-100">
                                Sửa
                            </button>

                            {item.enable ? (
                                <button
                                    onClick={() => handleDisable(item.rule_id)}
                                    className="rounded border border-red-300 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                                >
                                    Vô hiệu
                                </button>
                            ) : (
                                <button
                                    onClick={() => handleDisable(item.rule_id)}
                                    className="rounded border border-green-300 px-3 py-1 text-xs font-medium text-green-600 hover:bg-green-50"
                                >
                                    Kích hoạt
                                </button>
                            )}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>

    );

    return (
        <div>
            {/* TAB HEADER */}
            <div className="flex border-b mb-4">
                <button
                    onClick={() => setActiveTab("promotion")}
                    className={`px-4 py-2 border-b-2 cursor-pointer ${activeTab === "promotion"
                        ? "border-black font-semibold"
                        : "border-transparent text-gray-500"
                        }`}
                >
                    Chương trình khuyến mãi
                </button>
                <button
                    onClick={() => setActiveTab("holiday")}
                    className={`px-4 py-2 border-b-2 cursor-pointer ${activeTab === "holiday"
                        ? "border-black font-semibold"
                        : "border-transparent text-gray-500"
                        }`}
                >
                    Ngày lễ / Sự kiện
                </button>


            </div>

            {/* TAB CONTENT */}
            {
                loading ? <>  <div className="py-7">
                    <Spinner />
                </div>
                </> : <>
                    {renderTable(dataToShow)}
                </>
            }


        </div>
    );
}

export default PromotionTable;
