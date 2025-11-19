import { numberToLetter } from "@/lib/function";
import Image from "next/image";
import Spinner from "../Spinner/Spinner";

function Room({ data }) {
  if (!data || !Array.isArray(data.aside_gap)) return <Spinner />;

  return (
    <div>
      <div className="flex justify-center text-4xl font-bold my-16 uppercase">
        CHỌN GHẾ - {data.name}
      </div>
      <div className="flex justify-center">
        <div className="pb-5">
          <div className="relative pb-5">
            <Image
              src="/img_screen.png"
              width={120}
              height={50}
              alt="màn hình"
              className="w-full "
            />
            <div className="absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2">
              MÀN HÌNH
            </div>
          </div>
          {data.aside_gap.map((asg, i) => {
            let seatIndex = 1; // bắt đầu đếm ghế từ 1 cho mỗi dòng

            return (
              <div key={i} className="flex gap-4 p-3">
                <div className="w-8">{numberToLetter(i)}</div>

                {Array.from({ length: data.width }).map((_, col) => {
                  const column = col + 1;

                  // kiểm tra cột là khoảng trống hay ghế
                  const isAside = asg.aside.some(
                    (g) =>
                      column >= g.gap_index &&
                      column < g.gap_index + g.gap_width
                  );

                  // nếu không phải aside → tạo mã ghế
                  let seatLabel = "";
                  if (!isAside) {
                    seatLabel = `${numberToLetter(i)}${seatIndex}`;
                    seatIndex++; // tăng cho ghế tiếp theo
                  }

                  return (
                    <div
                      key={col}
                      className={`${
                        isAside
                          ? "bg-transparent"
                          : "bg-white hover:cursor-pointer"
                      } w-10 h-8 rounded-xl flex items-center justify-center text-(--color-purple)
                          font-semibold`}
                    >
                      {!isAside && seatLabel}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
      <div className="flex justify-between ">
        <div className="flex gap-3">
          <div className="bg-white w-10 h-8 rounded-xl"> </div>
          <div>Ghế trống</div>
        </div>
        <div className="flex gap-3">
          <div className="bg-(--color-yellow) w-10 h-8 rounded-xl"> </div>
          <div>Ghế chọn</div>
        </div>
        <div className="flex gap-3">
          <div className="bg-gray-500 w-10 h-8 rounded-xl"> </div>
          <div>Ghế đã đặt</div>
        </div>
      </div>
    </div>
  );
}

export default Room;
