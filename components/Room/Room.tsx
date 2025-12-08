import { numberToLetter } from "@/lib/function";
import Image from "next/image";
import Spinner from "../Spinner/Spinner";

function Room({
  data,
  seats,
  selectSeat,
  seatSelected,
}: {
  selectSeat: (
    seat_id: number,
    label: string,
    rowSeat: [],
    colSeat: number,
    aside: []
  ) => void;
}) {
  if (!data || !Array.isArray(data.aside_gap)) return <Spinner />;
  return (
    <div>
      <div
        className="flex justify-center text-2xl md:text-4xl font-bold my-4 md:my-12 uppercase
      text-center"
      >
        CHỌN GHẾ - {data.name}
      </div>
      <div className="flex justify-center">
        <div
          className="mt-4 mb-6 px-5 py-3 rounded-xl bg-yellow-50 border
                   border-yellow-300 text-yellow-700 text-sm max-w-xl text-center 
                   shadow-sm"
        >
          Chú ý: Khi chọn nhiều ghế, cần tránh để lại khoảng trống ở giữa để đảm
          bảo không vi phạm quy định chọn ghế.
        </div>
      </div>

      <div className="flex justify-center">
        <div className="pb-5">
          <div className="relative pb-5">
            <Image
              src="/img_screen.png"
              width={120}
              height={50}
              alt="màn hình"
              className="w-full"
            />
            <div className="absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2">
              MÀN HÌNH
            </div>
          </div>
          {data.aside_gap.map((asg, i) => {
            const aside = Array.isArray(asg?.aside) ? [...asg.aside] : [];
            let seatIndex = 1; // bắt đầu đếm ghế từ 1 cho mỗi dòng
            let rowSeats: Array<{
              seat_column: number;
              status: number;
              selected: boolean;
            }> = [];

            return (
              <div key={i} className="flex gap-1 md:gap-4 p-1 md:p-3">
                <div className="hidden md:block w-8">{numberToLetter(i)}</div>

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
                  let isBooked = false;
                  let seat_id = -1;
                  let col_real = -1;
                  if (!isAside) {
                    seatLabel = `${numberToLetter(i)}${seatIndex}`;
                    col_real = seatIndex;
                    // tìm ghế trong data seats
                    const seat = seats.find(
                      (s) =>
                        s.seat_row === numberToLetter(i) &&
                        Number(s.seat_column) === seatIndex // seat_column BE bắt đầu từ 1
                    );

                    if (seat) {
                      seat_id = seat.seat_id;
                    }

                    if (seat?.status === 1) {
                      isBooked = true;
                    }

                    //TẠO MẢNG rowSeats
                    rowSeats.push({
                      seat_column: col_real,
                      status: seat?.status ?? 0,
                      selected: seatSelected.some((s) => s.seat_id === seat_id),
                    });

                    seatIndex++;
                  }

                  return (
                    <div
                      key={col}
                      className={`${
                        isAside
                          ? "bg-transparent"
                          : isBooked
                          ? "bg-gray-500 text-white"
                          : seatSelected.some((s) => s.seat_id === seat_id)
                          ? "bg-(--color-yellow) hover:cursor-pointer"
                          : "bg-white hover:cursor-pointer"
                      } w-8 h-6 md:w-10 md:h-8 rounded-lg md:rounded-xl flex items-center 
                      justify-center text-(--color-purple) font-semibold`}
                      onClick={
                        !isBooked && !isAside
                          ? () =>
                              selectSeat(
                                seat_id,
                                seatLabel,
                                rowSeats,
                                col_real,
                                aside
                              )
                          : undefined
                      }
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
      <div className="flex justify-between">
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
