import Image from "next/image";
import Button from "./Button";
import Link from "next/link";

function Header() {
  return (
    <header className="bg-(--color-bg-primary) text-white pl-32 pr-32">
      <div className="max-w-7xl mx-auto flex items-center justify-between border-b border-b-gray-500 ">
        <div className=" flex gap-5">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center ">
              <Image
                src="/logo.png"
                alt="CineGo"
                width={120}
                height={20}
                className="w-[130px] h-[50px]"
              />
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <Button />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:block">Tìm kiếm</div>
          <div className="flex">
            <div>icon</div>
            <div>Đăng nhập/Đăng ký</div>
          </div>
        </div>
      </div>
      <div>heder dưới</div>
    </header>
  );
}

export default Header;
