"use client";

import React, { useEffect, useState } from "react";
import ProfileCard from "@/components/ProfileCard/ProfileCard";
import ProfileForm from "@/components/ProfileForm/ProfileForm";
import MembershipInfo from "@/components/MemberShipInfo/MemberShipInfo";
import PasswordForm from "@/components/PasswordForm/PasswordForm";
import { getUserInfo } from "@/lib/axios/userAPI";
import { getBookingHistory } from "@/lib/axios/bookingAPI";
import { useSession, signOut } from "next-auth/react";
import Spinner from "@/components/Spinner/Spinner";
import Swal from "sweetalert2";
import BookingHistory from "@/components/BookingHistory/BookingHistory";

export default function verifyOtp() {
  const { data: session, status } = useSession();
  const [userData, setUserData] = useState<any | null>(null);
  const [bookingHis, setBookingHis] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCustomerInfo, setShowCustomerInfo] = useState(true);
  const [showMemberShipInfo, setShowMemberShipInfo] = useState(false);
  const [showHistoryBooking, setShowHitoryBooking] = useState(false);
  const [userID, setUserID] = useState<number | string>();
  useEffect(() => {
    // chỉ gọi khi session đã load và tồn tại user.id
    if (status === "authenticated") {
      // session.user.id phải tồn tại — xem phần callback trên
      const id = (session as any).user?.user_id;
      if (!id) {
        setError(
          "User id not found in session. Make sure you include id in session callback."
        );
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
      getBookingHistory(id)
        .then((res) => {
          setBookingHis(res);
        })
        .catch((err) => {
          console.error(err);
          setError(String(err?.message || err));
        })
        .finally(() => setLoading(false));
    }
  }, [session, status]);

  if (status === "loading") {
    return (
      <div className="py-10 flex justify-center">
        <Spinner text="Đang xử lý phiên đăng nhập..." />
      </div>
    );
  }
  if (error) {
    return <div className="text-red-400 p-4">{error}</div>;
  }
  if (loading || !userData) {
    return (
      <div className="py-10 flex justify-center">
        <Spinner text="Đang tải dữ liệu người dùng..." />
      </div>
    );
  }

  const initial = {
    name: userData.name,
    birthday: userData.birthday,
    phone: userData.phone_number,
    email: userData.email,
  };
  const initialCard = {
    name: userData.name,
    points: userData.point,
    tier: userData.vip === 0 ? "C'Friends" : "C'Vip",
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
    signOut({ callbackUrl: "/" });
  }
  const handleShowCustomerInfo = () => {
    setShowCustomerInfo(true);
    setShowMemberShipInfo(false);
    setShowHitoryBooking(false);
  };
  const handleShowMemberShipInfo = () => {
    setShowMemberShipInfo(true);
    setShowCustomerInfo(false);
    setShowHitoryBooking(false);
  };
  const handleShowBookingHistory = () => {
    setShowHitoryBooking(true);
    setShowCustomerInfo(false);
    setShowMemberShipInfo(false);
  };
  return (
    <div
      className="text-black pb-20
      bg-[linear-gradient(180deg,var(--color-blue-black)_0%,#2b3b5e_100%)]"
    >
      {/* {loading ? (
                <div className="py-10 flex justify-center">
                    <Spinner text="Đang xử lý..." />
                </div>
            ) : ( */}
      {/* <div className="h-(--width-header)"></div> */}

      <div>
        {loading ? (
          <div className="py-10 flex justify-center">
            <Spinner text="Đang xử lý..." />
          </div>
        ) : (
          <div className="flex w-full gap-7">
            {/* Cột trái: card */}
            <div className="flex-shrink-0">
              <ProfileCard
                user={initialCard}
                onEditAvatar={handleEdit}
                onViewProfile={handleView}
                onLogout={logout}
                onShowCustomerInfo={handleShowCustomerInfo}
                onShowMemberShipInfo={handleShowMemberShipInfo}
                onShowBookingHistory={handleShowBookingHistory}
              />
            </div>

            {/* Cột phải: form dãn hết */}
            <div className="flex-1 min-w-0">
              {showCustomerInfo && (
                <>
                  {userID !== undefined && (
                    <ProfileForm
                      id={userID}
                      initialData={initial}
                      onSave={handleSave}
                    />
                  )}
                  <div className="mt-4">
                    <PasswordForm id={userID} onSave={handleSave} />
                  </div>
                </>
              )}
              {showMemberShipInfo && (
                <>
                  <MembershipInfo />
                </>
              )}
              {showHistoryBooking && (
                <>
                  <BookingHistory bookings={bookingHis} />
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
