"use client";

import React from "react";
import ProfileCard from "@/components/ProfileCard/ProfileCard";
import ProfileForm from "@/components/ProfileForm/ProfileForm";
import PasswordForm from "@/components/PasswordForm/PasswordForm";
export default function verifyOtp() {
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
                        <ProfileForm />
                        <div className="mt-4">
                            <PasswordForm />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

}
