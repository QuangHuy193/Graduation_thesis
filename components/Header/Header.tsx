"use client";
import Image from "next/image";
import Button from "../Button/Button";
import Link from "next/link";
import {
  faLocationDot,
  faMagnifyingGlass,
  faTicket,
  faUser,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { jwtDecode } from "jwt-decode";
import styles from "./Header.module.scss";
import Tippy from "@tippyjs/react";
import { useEffect, useState } from "react";
import { CinemaOnlyCity } from "@/lib/interface/cinemaInterface";


function Header() {
  const [cinemas, setCinemas] = useState<CinemaOnlyCity[]>([]);
  const [user, setUser] = useState<{ name?: string } | null>(null);
  interface JwtPayload {
    user_id: string;
    name: string;
    email: string;
    role: string;
    iat?: number;
    exp?: number;
  }

  // ✅ Kiểm tra user login (token + user info)
  useEffect(() => {
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (token) {
        const decoded = jwtDecode<JwtPayload>(token);
        if (decoded && decoded.name) {
          setUser({ name: decoded.name });
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error("Error decoding JWT:", err);
      setUser(null);
    }
  }, []);

  // ✅ Logout handler (xóa token)
  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <header className="bg-(--color-blue-black) text-white px-10 w-full h-(--width-header) fixed z-11">
      <div
        className="max-w-7xl mx-auto flex items-center justify-between border-b
       border-b-gray-500 py-1"
      >
        <div className="flex gap-5">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center ">
              <Image
                src="/logo.png"
                alt="CineGo"
                width={120}
                height={20}
                className="w-[130px] h-[60px]"
              />
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <Button text="ĐẶT VÉ NGAY" icon={faTicket} p_l_r="12px" />
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Ô tìm kiếm */}
          <div className="hidden sm:block relative ">
            <input
              className="bg-white rounded-2xl outline-none py-1 pl-3 w-[250px]
               text-gray-500 placeholder-gray-400 placeholder:text-[12px]"
              placeholder="Tìm phim..."
            />
            <FontAwesomeIcon
              className="absolute top-1/2 right-2 -translate-y-1/2 text-black"
              icon={faMagnifyingGlass}
            />
          </div>

          {/* ✅ User section */}
          <div className="flex gap-1.5 items-center">
            <FontAwesomeIcon icon={faUser} />
            {user ? (
              <div className="relative group flex items-center gap-2">
                <span className="font-medium text-(--color-yellow) cursor-pointer select-none">
                  {user.name}
                </span>
                <div
                  className="absolute left-0 top-full mt-1 bg-gray-800 rounded shadow-md 
                   opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 
                   transition-all duration-300 min-w-[100px] z-50"
                >
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-[13px] text-white hover:bg-red-500 rounded border-2 border-amber-800"
                  >
                    Đăng xuất
                  </button>
                </div>
              </div>
            ) : (
              <Link
                href={"/login"}
                className="cursor-pointer hover:text-(--color-yellow)"
              >
                Đăng nhập
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Dòng dưới của header */}
      <div className="flex items-center justify-between py-2">
        <div className="flex gap-3">
          <div className={`${styles.hd_bottom_left_item}`}>
            <div>
              <FontAwesomeIcon icon={faLocationDot} />
            </div>
            <Tippy
              className="bg-(--color-blue-black) min-w-[900px]"
              placement="bottom-start"
              arrow={false}
              interactive={true}
              delay={[150, 0]}
              duration={[300, 0]}
              offset={[0, 3]}
              theme="cinego"
              content={
                <div
                  className="grid grid-cols-3 gap-2 bg-(--color-blue-black) text-white 
                  p-2 rounded-md shadow-lg "
                >
                  {Array.isArray(cinemas) && cinemas.length > 0 &&
                    cinemas.map((cinema: CinemaOnlyCity) => (
                      <Link
                        href={`/cinema/${cinema.cinema_id}`}
                        key={cinema.cinema_id}
                        className="hover:text-(--color-yellow) cursor-pointer py-1 px-2 rounded transition-colors duration-200"
                      >
                        {cinema.name} ({cinema.province})
                      </Link>
                    ))
                  }

                </div>
              }
            >
              <div>Chọn rạp</div>
            </Tippy>
          </div>
          <div className={`${styles.hd_bottom_left_item}`}>
            <div>
              <FontAwesomeIcon icon={faLocationDot} />
            </div>
            <Link href={"/showtimes"}>Lịch chiếu</Link>
          </div>
        </div>

        <div className="flex gap-3">
          <Link
            href={"/promotions"}
            className={`${styles.hd_bottom_right_item}`}
          >
            Khuyến mãi
          </Link>
          <Link href={"/about"} className={`${styles.hd_bottom_right_item}`}>
            Giới thiệu
          </Link>
        </div>
      </div>
    </header>
  );
}

export default Header;
