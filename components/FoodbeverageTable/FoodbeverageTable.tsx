"use client";

import { useEffect, useState } from "react";
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

export default function FoodbeverageTable({ foodbeverage }: Props) {
    const [foods, setFoods] = useState<Food[]>([]);
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
        if (!confirm("Xóa món này?")) return;
        setFoods(prev => prev.filter(f => f.food_id !== id));
    };

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
                            <td className="border p-2">
                                <img
                                    src={food.image}
                                    alt={food.name}
                                    className="w-12 h-12 object-cover mx-auto"
                                />
                            </td>
                            <td className="border p-2">{food.name}</td>
                            <td className="border p-2">{food.type}</td>
                            <td className="border p-2">
                                {food.price.toLocaleString("vi-VN")} ₫
                            </td>
                            <td className="border p-2">{food.description}</td>
                            <td className="border p-2 space-x-2">
                                <button className="px-2 py-1 bg-yellow-400 rounded cursor-pointer">
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
        </div>
    );
}
