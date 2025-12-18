"use client";

import React, { useState } from "react";

type PromotionRule = {
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

// 🔹 MOCK DATA
const mockData: PromotionRule[] = [
    {
        rule_id: 1,
        name: "Tết Nguyên Đán 2025",
        start_time: "2025-01-25 00:00:00",
        end_time: "2025-02-05 23:59:59",
        priority: 1,
        enable: 1,
        display: 1,
        description: "Sự kiện Tết – giá vé đặc biệt",
        isHoliday: 1,
    },
    {
        rule_id: 2,
        name: "Giảm 20% vé sinh viên",
        start_time: "2025-03-01 00:00:00",
        end_time: "2025-03-31 23:59:59",
        priority: 2,
        enable: 1,
        display: 1,
        description: "Áp dụng cho HSSV",
        isHoliday: 0,
    },
    {
        rule_id: 3,
        name: "Lễ 30/4 - 1/5",
        start_time: "2025-04-30 00:00:00",
        end_time: "2025-05-01 23:59:59",
        priority: 1,
        enable: 1,
        display: 1,
        description: "Ngày lễ toàn quốc",
        isHoliday: 1,
    },
];

function PromotionTable() {
    const [activeTab, setActiveTab] = useState<"holiday" | "promotion">("promotion");

    const holidayList = mockData.filter((p) => p.isHoliday === 1);
    const promotionList = mockData.filter((p) => !p.isHoliday);

    const dataToShow =
        activeTab === "promotion" ? holidayList : promotionList;

    const renderTable = (data: PromotionRule[]) => (
        <table className="w-full border border-gray-300 text-sm">
            <thead className="bg-gray-100">
                <tr>
                    <th className="border px-2 py-1">ID</th>
                    <th className="border px-2 py-1">Tên</th>
                    <th className="border px-2 py-1">Thời gian</th>
                    <th className="border px-2 py-1">Độ ưu tiên</th>
                    <th className="border px-2 py-1">Đang hoạt động</th>
                    <th className="border px-2 py-1">Hiển thị</th>
                    <th className="border px-2 py-1">Mô tả</th>
                    <th className="border px-2 py-1">Hành động</th>
                </tr>
            </thead>
            <tbody>
                {data.length === 0 && (
                    <tr>
                        <td colSpan={8} className="border px-2 py-4 text-center">
                            Không có dữ liệu
                        </td>
                    </tr>
                )}

                {data.map((item) => (
                    <tr key={item.rule_id} className="hover:bg-gray-50">
                        <td className="border px-2 py-1 text-center">{item.rule_id}</td>
                        <td className="border px-2 py-1">{item.name}</td>
                        <td className="border px-2 py-1">
                            {item.start_time || "—"} <br />
                            {item.end_time || "—"}
                        </td>
                        <td className="border px-2 py-1 text-center">{item.priority}</td>
                        <td className="border px-2 py-1 text-center">
                            {item.enable ? "Bật" : "Tắt"}
                        </td>
                        <td className="border px-2 py-1 text-center">
                            {item.display ? "Có" : "Không"}
                        </td>
                        <td className="border px-2 py-1">{item.description}</td>
                        <td className="border px-2 py-1 text-center">
                            <button className="px-2 py-1 mr-1 border rounded">
                                Sửa
                            </button>
                            <button className="px-2 py-1 border rounded">
                                Vô hiệu
                            </button>
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
            {renderTable(dataToShow)}
        </div>
    );
}

export default PromotionTable;
