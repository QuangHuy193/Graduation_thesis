"use client";
import Image from "next/image";
import Button from "../Button/Button";
import {
  faLocationDot,
  faMagnifyingGlass,
  faTicket,
  faCircleUser,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import styles from "./Header.module.scss";
import Tippy from "@tippyjs/react";
import UserMenu from "../UserMenu/UserMenu";
import { useEffect, useState } from "react";
import { CinemaOnlyCity } from "@/lib/interface/cinemaInterface";
import { getCinemasWithCityAPI } from "@/lib/axios/cinemasAPI";
import LoadingLink from "../Link/LinkLoading";
import { useSession, signOut } from "next-auth/react";
import { Input } from "antd";
import { useRouter } from "next/navigation";

function Header() {
  const [valueSearch, setValueSearch] = useState("");
  const router = useRouter();
  const [cinemas, setCinemas] = useState<CinemaOnlyCity[]>([]);
  const { data: session } = useSession();
  const user = session?.user;

  // ✅ Lấy danh sách rạp
  useEffect(() => {
    const getCinemas = async () => {
      const res = await getCinemasWithCityAPI();
      setCinemas(res);
    };
    getCinemas();
  }, []);

  // ✅ Logout handler
  const handleLogout = () => {
    signOut({ callbackUrl: "/" });
  };

  return (
    <header className="bg-(--color-blue-black) text-white px-10 w-full h-(--width-header) fixed z-11">
      <div
        className="max-w-7xl mx-auto flex items-center justify-between border-b
       border-b-gray-500 py-1"
      >
        <div className="flex gap-5">
          <div className="flex items-center gap-3">
            <LoadingLink href="/" className="flex items-center ">
              <Image
                src="/logo.png"
                alt="CineGo"
                width={120}
                height={20}
                className="w-[130px] h-[60px]"
              />
            </LoadingLink>
          </div>

          <div className="flex items-center gap-4">
            <Button
              text="ĐẶT VÉ NGAY"
              icon={faTicket}
              p_l_r="12px"
              link="/movie"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Ô tìm kiếm */}
          <div className="hidden sm:block relative ">
            <Input
              value={valueSearch}
              onChange={(e) => setValueSearch(e.target.value)}
              onPressEnter={() => router.push(`search?keyword=${valueSearch}`)}
              placeholder="Tìm phim..."
              size="small"
              className="w-[250px]! rounded-3xl! h-10! placeholder:text-[12px]!
              text-gray-500! placeholder-gray-400! py-1! pl-3! text-[13px]!"
              suffix={
                <FontAwesomeIcon
                  icon={faMagnifyingGlass}
                  className="text-gray-500 cursor-pointer"
                  onClick={() => router.push(`search?keyword=${valueSearch}`)}
                />
              }
            />
          </div>

          {/* ✅ User section */}
          <div className="flex gap-1.5 items-center">
            <FontAwesomeIcon icon={faCircleUser} size="lg" />
            <UserMenu user={user} handleLogout={handleLogout}></UserMenu>
          </div>
        </div>
      </div>

      {/* Dòng dưới của header */}
      <div className="flex items-center justify-between pt-2 pb-4">
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
                cinemas.length > 0 ? (
                  <div
                    className="grid grid-cols-3 gap-2 bg-(--color-blue-black) text-white 
                  p-2 rounded-md shadow-lg "
                  >
                    {Array.isArray(cinemas) &&
                      cinemas.length > 0 &&
                      cinemas.map((cinema: CinemaOnlyCity) => (
                        <LoadingLink
                          href={`/cinema/${cinema.cinema_id}`}
                          key={cinema.cinema_id}
                          className="hover:text-(--color-yellow) cursor-pointer py-1 px-2 rounded transition-colors duration-200"
                        >
                          {cinema.name} ({cinema.province})
                        </LoadingLink>
                      ))}
                  </div>
                ) : (
                  "Đang tải dữ liệu..."
                )
              }
            >
              <div>Chọn rạp</div>
            </Tippy>
          </div>
          <div className={`${styles.hd_bottom_left_item}`}>
            <div>
              <FontAwesomeIcon icon={faLocationDot} />
            </div>
            <LoadingLink href={"/showtimes"}>Lịch chiếu</LoadingLink>
          </div>
        </div>

        <div className="flex gap-3">
          <LoadingLink
            href={"/promotions"}
            className={`${styles.hd_bottom_right_item}`}
          >
            Khuyến mãi
          </LoadingLink>
          <LoadingLink
            href={"/about"}
            className={`${styles.hd_bottom_right_item}`}
          >
            Giới thiệu
          </LoadingLink>
        </div>
      </div>
    </header>
  );
}

export default Header;
