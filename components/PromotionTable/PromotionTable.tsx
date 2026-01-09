"use client";
import React, { useEffect, useState } from "react";
import { togglePromotionEnable } from "@/lib/axios/admin/promotion_ruleAPI";
import Spinner from "../Spinner/Spinner";
import PromotionFormEdit from "../PromotionFormEdit/PromotionFormEdit";
import PromotionCreateModal from "../PromotionCreateModal/PromotionCreateModal";
import { on } from "events";
import UploadPicture from "../UploadPicture/UploadPicture";

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
    onAdd: () => void;
    user?: any;
}
// 🔹 MOCK DATA

function PromotionTable({ promotion, onEdit, onAdd, user }: Props) {
    const [activeTab, setActiveTab] = useState<"holiday" | "promotion">("promotion");
    const [dataList, setDatalist] = useState<PromotionRule[]>([]);
    const [loading, setLoading] = useState(false);
    const [editingPromotion, setEditingPromotion] = useState<PromotionRule | null>(null);
    const [openAddForm, setOpenAddForm] = useState(false);
    // const [openUpload, setOpenUpload] = useState(false);
    const [uploadTarget, setUploadTarget] = useState<PromotionRule | null>(null);

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
    const handleCreate = async (payload: any) => {
        // console.log("CREATE PROMOTION:", payload);
        // await fetch("/api/admin/promotions", { method: "POST", body: JSON.stringify(payload) })

        setOpenAddForm(false);
    };
    const renderTable = (data: PromotionRule[]) => (
        <div className="rounded-lg overflow-hidden">
            <table className="w-full text-sm">
                <thead className="bg-gray-100">
                    <tr>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700">
                            Hình ảnh
                        </th>
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
                            className="border-t border-b border-gray-700 hover:bg-gray-100 transition"
                        >
                            {/* Hình ảnh */}
                            <td className="px-3 py-2">
                                {item.image ? (
                                    <div className="relative group inline-block">
                                        <img
                                            src={item.image}
                                            alt="Promotion"
                                            className="w-16 h-16 object-cover rounded cursor-pointer border"
                                            onClick={() => setUploadTarget(item)}
                                        />

                                        {/* Ảnh phóng to khi hover */}
                                        <div
                                            className="fixed hidden group-hover:block z-9999"
                                            style={{
                                                top: "50%",
                                                left: "50%",
                                                transform: "translate(-50%, -50%)",
                                            }}
                                        >

                                            <img
                                                src={item.image}
                                                alt="Preview"
                                                className="w-180 h-90 object-contain rounded-lg shadow-xl border bg-white"
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="w-16 h-16 bg-gray-200 flex items-center justify-center rounded border cursor-pointer">
                                        <span className="text-gray-400 text-sm" onClick={() => setUploadTarget(item)}>No Image</span>
                                    </div>
                                )

                                }

                            </td>

                            {/* Tên */}
                            < td className="px-3 py-2 font-medium text-gray-800" >
                                {item.name}
                            </td>

                            {/* Thời gian */}
                            <td className="px-3 py-2 text-gray-600">
                                <div>{item.start_time || "Vô thời hạn"}</div>
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
                                <button className="mr-2 rounded border px-3 py-1 text-xs font-medium hover:bg-gray-100 cursor-pointer"
                                    onClick={() => setEditingPromotion(item)}
                                >
                                    Sửa
                                </button>
                                {user?.role === "superadmin" && (
                                    item.enable ? (
                                        <button
                                            onClick={() => handleDisable(item.rule_id)}
                                            className="w-[90px] rounded border border-red-300 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50 cursor-pointer"
                                        >
                                            Vô hiệu
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleDisable(item.rule_id)}
                                            className="w-[90px] rounded border border-green-300 px-3 py-1 text-xs font-medium text-green-600 hover:bg-green-50 cursor-pointer"
                                        >
                                            Kích hoạt
                                        </button>
                                    )

                                )}

                            </td>
                        </tr>
                    ))}
                </tbody>
            </table >


        </div >


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

                <button
                    onClick={() => setOpenAddForm(true)}
                    className="
    ml-auto
    inline-flex items-center gap-2
    px-4 py-2
    rounded-lg
    bg-gradient-to-r from-blue-600 to-blue-500
    text-white text-sm font-medium
    shadow-sm
    hover:from-blue-700 hover:to-blue-600
    hover:shadow-md
    transition
    cursor-pointer
  "
                >
                    <span className="text-lg leading-none">＋</span>
                    <span>Thêm CTKM</span>
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

            {editingPromotion && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="w-full max-w-xl rounded bg-white p-4">
                        <PromotionFormEdit
                            promotion={editingPromotion}
                            onSaved={async () => {
                                // setLoading(true);
                                setEditingPromotion(null);
                                await onEdit();          // reload list
                                // setLoading(false);
                            }}
                            onCancel={() => setEditingPromotion(null)}
                            setLoading={setLoading}
                            loading={loading}
                        />
                    </div>
                </div>
            )}
            {
                openAddForm && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                        <div className="w-full max-w-xl rounded bg-white p-4">
                            <PromotionCreateModal
                                open={openAddForm}
                                onClose={() => setOpenAddForm(false)}
                                onSubmit={async () => {
                                    //Gọi parent để reload
                                    onAdd();
                                    setOpenAddForm(false);
                                }}
                                setLoading={setLoading}
                                loading={loading}
                            />
                        </div>
                    </div>
                )
            }
            {
                uploadTarget && (
                    <div>
                        <UploadPicture
                            open={true}
                            onClose={() => setUploadTarget(null)}
                            target={{ type: "promotion", id: uploadTarget.rule_id }}
                            defaultCaption={uploadTarget.name}
                            onSuccess={() => {
                                setUploadTarget(null);
                                onEdit(); // reload lại danh sách
                            }}
                        />
                    </div>
                )
            }
        </div>
    );
}

export default PromotionTable;
