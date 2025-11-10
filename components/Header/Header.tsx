import Image from "next/image";
import Button from "../Button";
import Link from "next/link";
import {
  faLocationDot,
  faMagnifyingGlass,
  faTicket,
  faUser,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import styles from "./Header.module.scss";

function Header() {
  return (
    <header className="bg-(--color-blue-black) text-white pl-32 pr-32 fixed w-full">
      <div className="max-w-7xl mx-auto flex items-center justify-between border-b border-b-gray-500 ">
        <div className=" flex gap-5">
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
            <Button text="ĐẶT NGAY" icon={faTicket} p_l_r="12px" />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:block relative ">
            <input
              className="bg-(--color-white) rounded-2xl outline-none py-1 pl-3 w-[250px]
               text-gray-500 placeholder-gray-400 placeholder:text-[12px]"
              placeholder="Tìm phim..."
            />
            <FontAwesomeIcon
              className="absolute top-1/2 right-2 -translate-y-1/2 text-black"
              icon={faMagnifyingGlass}
            />
          </div>
          <div className="flex gap-1.5">
            <div>
              <FontAwesomeIcon icon={faUser} />
            </div>
            <div className="cursor-pointer hover:text-(--color-yellow)">
              Đăng nhập
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between py-1">
        <div className="flex gap-3">
          <div className={`${styles.hd_bottom_left_item}`}>
            <div>
              <FontAwesomeIcon icon={faLocationDot} />
            </div>
            <div>Chọn rạp</div>
          </div>
          <div className={`${styles.hd_bottom_left_item}`}>
            <div>
              <FontAwesomeIcon icon={faLocationDot} />
            </div>
            <div>Lịch chiếu</div>
          </div>
        </div>
        <div className="flex gap-3">
          <div className={`${styles.hd_bottom_right_item}`}>Khuyến mãi</div>
          <div className={`${styles.hd_bottom_right_item}`}>Giới thiệu</div>
        </div>
      </div>
    </header>
  );
}

export default Header;
