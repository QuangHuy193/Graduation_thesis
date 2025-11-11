"use client";
import Link from "next/link";
import styles from "./Footer.module.scss";
import Image from "next/image";
import Button from "../Button/Button";
import { useEffect, useState } from "react";
import { CinemaOnlyCity } from "@/lib/interface/cinemaInterface";

function Footer() {
  const [cinemas, setCinemas] = useState([]);

  useEffect(() => {
    const getCinemas = async () => {
      try {
        const res = await fetch("/api/cinemas");
        const data = await res.json();
        setCinemas(data);
      } catch (error) {
        console.error("Error fetching cinemas:", error);
      }
    };

    getCinemas();
  }, []);

  return (
    <footer
      className="text-white px-10 w-full pt-[70px] pb-5
    bg-[linear-gradient(90deg,#62368e_0%,#5395e1_100%)]"
    >
      <div className="grid grid-cols-4 gap-2">
        <div>
          <div>
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
          <div>YOUR STORY, YOUR SCREEN</div>
          <div className="mt-2.5">
            <Button text="ĐẶT VÉ" p_l_r="50px" hover_bg_color="#5F4CA2" />
          </div>
          <div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
          </div>
        </div>
        <div>
          <div className={`${styles.ft_title} `}>TÀI KHOẢN</div>
          <Link className={`${styles.ft_item}`} href={"/login"}>
            Đăng nhập
          </Link>
          <Link className={`${styles.ft_item}`} href={"/register"}>
            Đăng ký
          </Link>
          <Link className={`${styles.ft_item}`} href={"/membership"}>
            Membership
          </Link>
        </div>
        <div>
          <div className={`${styles.ft_title}`}>XEM PHIM</div>
          <Link className={`${styles.ft_item}`} href={"/movie/showing"}>
            Phim đang chiếu
          </Link>
          <Link className={`${styles.ft_item}`} href={"/movie/upcoming"}>
            Phim sắp chiếu
          </Link>
        </div>
        <div>
          <div className={`${styles.ft_title}`}>HỆ THỐNG RẠP</div>
          <div className="flex flex-col">
            {cinemas.map((cinema: CinemaOnlyCity) => (
              <Link
                href={`/cinema/${cinema.cinema_id}`}
                key={cinema.cinema_id}
                className="hover:text-(--color-yellow) cursor-pointer 
                py-1 rounded transition-colors duration-200"
              >
                {cinema.name} ({cinema.province})
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
