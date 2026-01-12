"use client";

import { useEffect, useState } from "react";
import FoodbeverageModalForm from "../FoodbeverageModalForm/FoodbeverageModalForm";
import { set } from "nprogress";
import { on } from "events";
import Swal from "sweetalert2";
import { deleteFood } from "@/lib/axios/admin/foodAPI";
import UploadPicture from "../UploadPicture/UploadPicture";
// import { getAllFoods } from "@/lib/axios/admin/foodAPI";
export type Food = {
    food_id: number;
    name: string;
    image?: string;
    price: number;
    type: "food" | "drink" | "combo";
    description?: string;
};
type Props = {
    foodbeverage: Food[];
    onAddSuccess?: () => void;
    onDeleteSuccess?: () => void;
    onInsertPictureToFoodSuccess?: () => void;
}
const mockFoods: Food[] = [
    {
        food_id: 1,
        name: "Bắp rang bơ",
        image: "https://via.placeholder.com/80",
        price: 35000,
        type: "food",
        description: "Bắp rang truyền thống",
    },
    {
        food_id: 2,
        name: "Coca Cola",
        image: "https://via.placeholder.com/80",
        price: 25000,
        type: "drink",
        description: "Nước ngọt có ga",
    },
    {
        food_id: 3,
        name: "Combo Couple",
        image: "https://via.placeholder.com/80",
        price: 89000,
        type: "combo",
        description: "2 nước + 1 bắp lớn",
    },
];

export default function FoodbeverageTable({ foodbeverage, onAddSuccess, onDeleteSuccess, onInsertPictureToFoodSuccess }: Props) {
    const [foods, setFoods] = useState<Food[]>([]);
    const [openModal, setOpenModal] = useState(false);
    const [uploadTarget, setUploadTarget] = useState<Food | null>(null);
    const [editFood, setEditFood] = useState<Food | null>(null);
    // console.log("foodbeverage:", foodbeverage);
    const [filter, setFilter] = useState<"all" | Food["type"]>("all");

    useEffect(() => {
        if (foodbeverage && foodbeverage.length > 0) {
            setFoods(foodbeverage);
        }
    }, [foodbeverage]);

    const filteredFoods =
        filter === "all" ? foods : foods.filter(f => f.type === filter);

    const handleDelete = (id: number) => {
        // if (!confirm("Xóa món này?")) return;
        Swal.fire({
            title: 'Bạn có chắc chắn muốn xóa món này?',
            showCancelButton: true,
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    // Gọi API xóa món ăn ở đây
                    // const res = await deleteFood(id);
                    const res = await deleteFood(id);
                    if (res) {
                        Swal.fire({
                            icon: "success",
                            title: "Xóa món ăn thành công",
                        });
                        onDeleteSuccess && onDeleteSuccess();
                        setFoods(prev => prev.filter(f => f.food_id !== id));
                    }

                } catch (error) {
                    console.error("Lỗi khi xóa món ăn:", error);
                }
            }
        });


    };
    const handleAdd = () => {
        setOpenModal(true);
    };
    const handleUpdate = (food: Food) => {
        setEditFood(food);
        setOpenModal(true);
    }
    return (
        <div className="p-6 bg-white rounded shadow">
            {/* <h2 className="text-xl font-semibold mb-4">🍿 Quản lý đồ ăn & nước uống</h2> */}

            {/* Filter */}
            <div className="flex gap-2 mb-4">
                {["all", "food", "drink", "combo"].map(t => (
                    <button
                        key={t}
                        onClick={() => setFilter(t as any)}
                        className={`px-3 py-1 rounded border cursor-pointer ${filter === t ? "bg-blue-600 text-white" : "bg-gray-100"
                            }`}
                    >
                        {t === "all" ? "Tất cả" : t}
                    </button>
                ))}
                <button
                    className="bg-blue-600 text-white px-3 py-1 rounded ml-auto cursor-pointer"
                    onClick={() => handleAdd()}
                >
                    Thêm món mới
                </button>
            </div>

            {/* Table */}
            <table className="w-full border-collapse border">
                <thead className="bg-gray-100">
                    <tr>
                        <th className="border p-2">Ảnh</th>
                        <th className="border p-2">Tên</th>
                        <th className="border p-2">Loại</th>
                        <th className="border p-2">Giá</th>
                        <th className="border p-2">Mô tả</th>
                        <th className="border p-2">Hành động</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredFoods.map(food => (
                        <tr key={food.food_id} className="text-center">
                            {/* <td className="border p-2">
                                <img
                                    src={food.image}
                                    alt={food.name}
                                    className="w-12 h-12 object-cover mx-auto"
                                />

                            </td> */}
                            <td className="border p-2">
                                {food.image ? (
                                    <div className="relative group inline-block">
                                        <img
                                            src={food.image}
                                            alt="Promotion"
                                            className="w-16 h-16 object-cover rounded cursor-pointer border"
                                            onClick={() => setUploadTarget(food)}
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
                                                src={food.image}
                                                alt="Preview"
                                                className="w-90 h-90 object-contain rounded-lg shadow-xl border bg-white"
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="w-16 h-full min-h-16 bg-gray-200 flex items-center justify-center ml-auto mr-auto rounded border cursor-pointer">
                                        <span className="text-gray-400 text-sm "
                                            onClick={() => setUploadTarget(food)}
                                        >No Image</span>
                                    </div>
                                )
                                }

                            </td>
                            <td className="border p-2">{food.name}</td>
                            <td className="border p-2">{food.type}</td>
                            <td className="border p-2">
                                {new Intl.NumberFormat("vi-VN", {
                                    style: "currency",
                                    currency: "VND",
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: 0,
                                }).format(food.price)}
                            </td>

                            <td className="border p-2">{food.description}</td>
                            <td className="border p-2 space-x-2">
                                <button
                                    className="px-2 py-1 bg-yellow-400 rounded cursor-pointer"
                                    onClick={() => handleUpdate(food)}
                                >
                                    Sửa
                                </button>
                                <button
                                    onClick={() => handleDelete(food.food_id)}
                                    className="px-2 py-1 bg-red-500 text-white rounded cursor-pointer"
                                >
                                    Xóa
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <FoodbeverageModalForm
                isOpen={openModal}
                food={editFood}
                onClose={() => {
                    setOpenModal(false);
                    setEditFood(null);
                }}
                onSuccess={() => onAddSuccess && onAddSuccess()}
            />
            {
                uploadTarget && (
                    <div>
                        <UploadPicture
                            open={true}
                            onClose={() => setUploadTarget(null)}
                            target={{ type: "food", id: uploadTarget.food_id }}
                            defaultCaption={uploadTarget.name}
                            onSuccess={() => {
                                setUploadTarget(null);
                                onInsertPictureToFoodSuccess && onInsertPictureToFoodSuccess();
                            }}
                        />
                    </div>
                )
            }
        </div>
    );
}
