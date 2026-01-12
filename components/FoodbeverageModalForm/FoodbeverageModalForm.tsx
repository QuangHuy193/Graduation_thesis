"use client";

import { addFood, updateFood } from "@/lib/axios/admin/foodAPI";
import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { Food } from "../FoodbeverageTable/FoodbeverageTable";

interface AddFoodModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    food?: Food | null;
}

export default function FoodbeverageModalForm({
    isOpen,
    onClose,
    onSuccess,
    food,
}: AddFoodModalProps) {
    const [form, setForm] = useState({
        name: "",
        image: "",
        price: "",
        type: "food",
        description: "",
    });

    const [loading, setLoading] = useState(false);


    useEffect(() => {
        if (food) {
            setForm({
                name: food.name ?? "",
                image: food.image ?? "",
                price: String(food.price),
                type: food.type ?? "food",
                description: food.description ?? "",
            });
        } else {
            // reset khi thêm mới
            setForm({
                name: "",
                image: "",
                price: "",
                type: "food",
                description: "",
            });
        }
    }, [food, isOpen]);
    if (!isOpen) return null;
    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async () => {
        if (!form.name || !form.price) {
            // alert("Tên món ăn và giá là bắt buộc");
            Swal.fire({
                icon: "error",
                title: "Tên món ăn và giá là bắt buộc",
                showConfirmButton: false,
            });
            return;
        }

        setLoading(true);

        try {
            if (food) {
                //Sửa food
                const res = await updateFood(String(food.food_id), form);
                if (res) {
                    Swal.fire({
                        icon: "success",
                        title: "Cập nhật món ăn thành công",
                        showConfirmButton: false,
                    });
                }
            } else {
                //Api thêm món ăn
                const res = await addFood(form);
                if (res) {
                    Swal.fire({
                        icon: "success",
                        title: "Thêm món ăn thành công",
                        showConfirmButton: false,
                    });
                }
            }

            // alert("Thêm món ăn thành công");
            onSuccess?.();
            onClose();
        } catch (error) {
            alert("Có lỗi xảy ra");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white w-full max-w-md rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">➕ Thêm món ăn</h2>

                <div className="space-y-3">
                    <input
                        name="name"
                        placeholder="Tên món ăn"
                        className="w-full border rounded px-3 py-2"
                        value={form.name}
                        onChange={handleChange}
                    />

                    {/* <input
                        name="image"
                        placeholder="Link hình ảnh"
                        className="w-full border rounded px-3 py-2"
                        value={form.image}
                        onChange={handleChange}
                    /> */}

                    <input
                        name="price"
                        type="number"
                        step="0.01"
                        placeholder="Giá"
                        className="w-full border rounded px-3 py-2"
                        value={form.price}
                        onChange={handleChange}
                    />

                    <select
                        name="type"
                        className="w-full border rounded px-3 py-2"
                        value={form.type}
                        onChange={handleChange}
                    >
                        <option value="food">🍔 Food</option>
                        <option value="drink">🥤 Drink</option>
                        <option value="combo">🎁 Combo</option>
                    </select>

                    <textarea
                        name="description"
                        placeholder="Mô tả"
                        className="w-full border rounded px-3 py-2"
                        value={form.description}
                        onChange={handleChange}
                    />
                </div>

                <div className="flex justify-end gap-2 mt-6">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded border cursor-pointer"
                    >
                        Hủy
                    </button>

                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50 cursor-pointer"
                    >
                        {loading ? "Đang lưu..." : "Lưu"}
                    </button>
                </div>
            </div>
        </div>
    );
}
