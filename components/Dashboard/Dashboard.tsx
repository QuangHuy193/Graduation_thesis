"use client";
import React, { useEffect, useRef, useState } from "react";
import { DashboardStats, DashboardWarnings } from "@/lib/interface/dashboardInterface";
/* ======================
   MOCK DATA (TẠM THỜI)
   ====================== */


type Props = {
    stats: DashboardStats | null;
    warnings: DashboardWarnings | null;
};




// 👉 Sau này: API /api/admin/dashboard/warning
const mockWarnings = {
    expiringPromotions: 2,
    moviesWithoutShowtime: 1,
};
// const hasWarning =
//     mockWarnings.expiringPromotions > 0 ||
//     mockWarnings.moviesWithoutShowtime > 0;
// 👉 Sau này: chỉ dùng router.push(...)
const quickActions = [
    { label: "Thêm phim", action: "add-movie" },
    { label: "Tạo suất chiếu", action: "add-showtime" },
    { label: "Tạo khuyến mãi", action: "add-promotion" },
];

export default function AdminDashboard({ stats, warnings }: Props) {
    const hasWarning =
        (warnings?.moviesWithoutShowtime ?? 0) > 0;
    return (
        <div className="space-y-6">
            {/* ===== HÔM NAY ===== */}
            <section className="rounded-lg border bg-white p-4">
                <h2 className="mb-3 text-sm font-semibold text-gray-700">
                    📅 Hôm nay
                </h2>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <StatCard
                        label="Suất chiếu"
                        value={stats?.showtimesToday}
                    />
                    <StatCard
                        label="Phim đang chiếu"
                        value={stats?.moviesNowShowing}
                    />
                    <StatCard
                        label="Khuyến mãi hoạt động"
                        value={stats?.activePromotions}
                    />
                </div>
            </section>

            {/* ===== CẦN XỬ LÝ ===== */}
            <section className="rounded-lg border bg-white p-4">
                <h2 className="mb-3 text-sm font-semibold text-gray-700">
                    ⚠️ Cần xử lý
                </h2>

                {!hasWarning ? (
                    <div className="rounded bg-green-50 px-3 py-2 text-sm text-green-700">
                        🎉 Không có vấn đề cần xử lý
                    </div>
                ) : (
                    <ul className="space-y-2 text-sm">
                        {/* {mockWarnings.expiringPromotions > 0 && (
                            <li className="flex items-center justify-between rounded bg-yellow-50 px-3 py-2">
                                <span>Khuyến mãi sắp hết hạn</span>
                                <span className="font-semibold text-yellow-700">
                                    {mockWarnings.expiringPromotions}
                                </span>
                            </li>
                        )} */}

                        {warnings.moviesWithoutShowtime > 0 && (
                            <li className="flex items-center justify-between rounded bg-red-50 px-3 py-2">
                                <span>Phim chưa có suất chiếu</span>
                                <span className="font-semibold text-red-600">
                                    {warnings?.moviesWithoutShowtime}
                                </span>
                            </li>
                        )}
                    </ul>
                )}
            </section>

            {/* ===== THAO TÁC NHANH ===== */}
            <section className="rounded-lg border bg-white p-4">
                <h2 className="mb-3 text-sm font-semibold text-gray-700">
                    🚀 Thao tác nhanh
                </h2>

                <div className="flex flex-wrap gap-3">
                    {quickActions.map((item) => (
                        <button
                            key={item.action}
                            className="rounded border px-4 py-2 text-sm font-medium hover:bg-gray-100 cursor-pointer"
                            // 👉 Sau này: router.push(...)
                            onClick={() => {
                                console.log("Action:", item.action);
                            }}
                        >
                            + {item.label}
                        </button>
                    ))}
                </div>
            </section>
        </div>
    );
}

/* ======================
   COMPONENT CON
   ====================== */

function StatCard({
    label,
    value,
}: {
    label: string;
    value: number;
}) {
    return (
        <div className="rounded-lg border bg-gray-50 px-4 py-3 text-center">
            <div className="text-2xl font-bold text-gray-800">{value}</div>
            <div className="mt-1 text-xs text-gray-500">{label}</div>
        </div>
    );
}
