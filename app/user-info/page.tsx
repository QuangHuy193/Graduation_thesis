"use client";

import React, { useEffect, useState } from "react";
import ProfileCard from "@/components/ProfileCard/ProfileCard";
import ProfileForm from "@/components/ProfileForm/ProfileForm";
import PasswordForm from "@/components/PasswordForm/PasswordForm";
import { getUserInfo } from "@/lib/axios/userAPI";
import { useSession } from "next-auth/react";
import Swal from "sweetalert2";

export default function verifyOtp() {
    const { data: session, status } = useSession();
    const [userData, setUserData] = useState<any | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [userID, setUserID] = useState<number | string>();
    useEffect(() => {
        // chỉ gọi khi session đã load và tồn tại user.id
        if (status === "authenticated") {
            // session.user.id phải tồn tại — xem phần callback trên
            const id = (session as any).user?.user_id;
            if (!id) {
                setError("User id not found in session. Make sure you include id in session callback.");
                return;
            }
            setUserID(id);
            setLoading(true);
            getUserInfo(id)
                .then((res) => {
                    setUserData(res);
                })
                .catch((err) => {
                    console.error(err);
                    setError(String(err?.message || err));
                })
                .finally(() => setLoading(false));
        }
    }, [session, status]);
    if (loading) return <div>Loading...</div>;
    if (!userData) return <div>No user data</div>;
    const initial = {
        name: userData.name,
        birthday: userData.birthday,
        phone: userData.phone_number,
        email: userData.email,
    };
    function handleSave() {
        return Swal.fire("Cập nhật thành công");
    }
    function handleEdit() {
        alert("Edit");
    }
    function handleView() {
        alert("View");
    }
    function logout() {
        alert("log out");
    }
    return (
        <div
            className="pl-32 pr-32 text-black pb-20
      bg-[linear-gradient(180deg,var(--color-blue-black)_0%,#2b3b5e_100%)]"
        >
            <div className="h-(--width-header)"></div>

            {/* container chính, rộng tối đa và căn giữa */}
            <div className="max-w-5xl mx-auto">
                <div className="flex w-full gap-7">
                    {/* Cột trái: card */}
                    <div className="flex-shrink-0">
                        <ProfileCard
                            onEditAvatar={handleEdit}
                            onViewProfile={handleView}
                            onLogout={logout}
                        />
                    </div>

                    {/* Cột phải: form dãn hết */}
                    <div className="flex-1 min-w-0">
                        {userID !== undefined && (
                            <ProfileForm id={userID} initialData={initial} onSave={handleSave} />
                        )}
                        <div className="mt-4">
                            <PasswordForm />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

}
