"use client";

import React from "react";

import { UserITF } from "@/lib/interface/userInterface";
import { toggleUserStatus } from "@/lib/axios/admin/userAPI";
import Swal from "sweetalert2";
import { toggleUserRole } from "@/lib/axios/userAPI";
type Props = {
    users: UserITF[],
    onEdit: () => void,
};
const STATUS_CONFIG = {
    1: {
        label: "Hoạt động",
        className: "bg-green-100 text-green-700",
        action: "Khóa",
    },
    0: {
        label: "Chưa kích hoạt",
        className: "bg-yellow-100 text-yellow-800",
        action: "Kích hoạt",
    },
    2: {
        label: "Bị khóa",
        className: "bg-red-100 text-red-700",
        action: "Mở khóa",
    },
};
const ROLE_CONFIG = {
    admin: {
        label: "Admin",
        className: "bg-blue-100 text-blue-700",
        action: "▼",
    },
    user: {
        label: "Người dùng",
        className: "bg-gray-100 text-gray-700",
        action: "▲",
    },
};
export default function UserTable({ users, onEdit }: Props) {
    const handleToggleStatus = (user: UserITF) => {
        let nextStatus: number;
        let title: string;

        if (user.status === 1) {
            nextStatus = 2;
            title = "Khóa người dùng?";
        } else if (user.status === 2) {
            nextStatus = 1;
            title = "Mở khóa người dùng?";
        } else {
            nextStatus = 1;
            title = "Kích hoạt người dùng?";
        }

        Swal.fire({
            title,
            text: user.email,
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Xác nhận",
            cancelButtonText: "Hủy",
        }).then(async (res) => {
            if (!res.isConfirmed) return;

            try {
                // 👉 GỌI API Ở ĐÂY
                await toggleUserStatus(user.user_id);

                // console.log("Update user:", {
                //     user_id: user.user_id,
                //     status: nextStatus,
                // });

                Swal.fire({
                    icon: "success",
                    title: "Thành công",
                    timer: 1200,
                    showConfirmButton: false,
                });

                // 👉 reload lại danh sách user
                onEdit();
            } catch (error) {
                console.error(error);
                Swal.fire({
                    icon: "error",
                    title: "Lỗi",
                    text: "Không thể cập nhật trạng thái người dùng",
                });
            }
        });
    };
    const handleToggleRole = (user: UserITF) => {
        // ❌ Không cho đụng tới superadmin
        if (user.role === "superadmin") return;

        let nextRole: "user" | "admin";
        let title: string;

        if (user.role === "user") {
            nextRole = "admin";
            title = "Thăng chức người dùng này ?";
        } else {
            // admin
            nextRole = "user";
            title = "Giáng chức quản trị viên này ?";
        }

        Swal.fire({
            title,
            text: user.email,
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Xác nhận",
            cancelButtonText: "Hủy",
        }).then(async (res) => {
            if (!res.isConfirmed) return;

            try {
                // 👉 GỌI API ĐỔI ROLE
                await toggleUserRole(user.user_id);

                Swal.fire({
                    icon: "success",
                    title: "Thành công",
                    timer: 1200,
                    showConfirmButton: false,
                });

                // 👉 báo parent reload
                onEdit();
            } catch (err) {
                console.error(err);
                Swal.fire({
                    icon: "error",
                    title: "Lỗi",
                    text: "Không thể cập nhật quyền người dùng",
                });
            }
        });
    };



    const roleBadge = (role: string) => {
        const map: any = {
            superadmin: "bg-red-100 text-red-700",
            admin: "bg-blue-100 text-blue-700",
            user: "bg-slate-100 text-slate-700",
        };
        return (
            <span
                className={`px-2 py-1 rounded text-xs font-medium ${map[role]}`}
            >
                {role}
            </span>
        );
    };

    return (
        <div className="bg-white rounded shadow overflow-x-auto">
            <table className="w-full text-sm">
                <thead className="bg-slate-100 text-left">
                    <tr>
                        {/* <th className="px-3 py-2">ID</th> */}
                        <th className="px-3 py-2">Tên</th>
                        <th className="px-3 py-2">Email</th>
                        <th className="px-3 py-2">SĐT</th>
                        <th className="px-3 py-2">Vai trò</th>
                        <th className="px-3 py-2">VIP</th>
                        <th className="px-3 py-2">Điểm</th>
                        <th className="px-3 py-2">Trạng thái</th>
                        <th className="px-3 py-2 text-center">Hành động</th>
                    </tr>
                </thead>

                <tbody>
                    {users.map((u) => (
                        <tr
                            key={u.user_id}
                            className="border-t hover:bg-slate-50"
                        >
                            {/* <td className="px-3 py-2">{u.user_id}</td> */}
                            <td className="px-3 py-2 font-medium">{u.name}</td>
                            <td className="px-3 py-2">{u.email}</td>
                            <td className="px-3 py-2">{u.phone_number}</td>
                            {/* <td className="px-3 py-2">{roleBadge(u.role)}</td> */}
                            <td className="px-3 py-2">
                                <span
                                    className={`px-2 py-1 rounded text-xs font-medium inline-block ${ROLE_CONFIG[u.role]?.className}`}
                                >
                                    {ROLE_CONFIG[u.role]?.label}
                                </span>
                            </td>

                            <td className="px-3 py-2">
                                {u.vip ? "⭐ VIP" : "-"}
                            </td>
                            <td className="px-3 py-2">{u.point}</td>
                            <td className="px-3 py-2">
                                <span
                                    className={`px-2 py-1 rounded text-xs font-medium ${STATUS_CONFIG[u.status]?.className}`}
                                >
                                    {STATUS_CONFIG[u.status]?.label}
                                </span>
                            </td>
                            <td className="px-3 py-2">
                                <div className="flex justify-center gap-2">
                                    {/* Button trạng thái */}
                                    <button
                                        onClick={() => handleToggleStatus(u)}
                                        className={`
        w-[90px] px-3 py-1 text-xs rounded font-medium
        transition
        bg-gray-100 text-gray-700
        border-1
        hover:opacity-80
        cursor-pointer
      `}
                                    >
                                        {STATUS_CONFIG[u.status]?.action}
                                    </button>

                                    {/* Button role */}
                                    <button
                                        disabled={u.role === "superadmin"}
                                        onClick={() => handleToggleRole(u)}
                                        className={`
        w-[90px] px-3 py-1 text-xs rounded font-medium
        transition
       bg-gray-100 text-gray-700
       border-1
        hover:opacity-80
        cursor-pointer
      `}
                                    >
                                        {ROLE_CONFIG[u.role]?.action}
                                    </button>
                                </div>
                            </td>


                        </tr>
                    ))}

                    {users.length === 0 && (
                        <tr>
                            <td
                                colSpan={9}
                                className="text-center py-6 text-slate-500"
                            >
                                Không có người dùng
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
