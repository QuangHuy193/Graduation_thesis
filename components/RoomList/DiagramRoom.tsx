"use client";
import { useEffect, useState } from "react";
import styles from "./DiagramRoom.module.scss";
import { createRoomAPI, getRoomAsileWithIdAPI } from "@/lib/axios/roomAPI";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faPenToSquare,
  faPlus,
  faRotateRight,
} from "@fortawesome/free-solid-svg-icons";
import Swal from "sweetalert2";

function DiagramRoom({ room, setToggleRoom, cinemaId }) {
  const [state, setState] = useState({
    isFetch: false,
    room: {},
    selected: {
      name: "",
      width: 0,
      height: 0,
      capacity: 0,
      cinemaId: -1,
    },
    asideRoom: [],
  });

  // chuẩn hóa aside
  const asideMap = {};
  state.asideRoom?.aside_gap?.forEach((row) => {
    asideMap[row.gap_row] = row.aside;
  });

  // bật tắt ghế
  const toggleSeat = (rowNumber, colNumber) => {
    setState((prev) => {
      const aside_gap = prev.asideRoom.aside_gap || [];

      // tìm row hiện tại
      const rowIndex = aside_gap.findIndex((r) => r.gap_row === rowNumber);

      const currentRow =
        rowIndex !== -1
          ? aside_gap[rowIndex]
          : { gap_row: rowNumber, aside: [] };

      const currentAside = currentRow.aside || [];

      // kiểm tra đang là gap không
      const isGap = currentAside.some(
        (g) => colNumber >= g.gap_index && colNumber < g.gap_index + g.gap_width
      );

      // tách toàn bộ gap thành danh sách cột
      let cols = [];
      currentAside.forEach((g) => {
        for (let i = g.gap_index; i < g.gap_index + g.gap_width; i++) {
          cols.push(i);
        }
      });

      if (isGap) {
        // bỏ gap → thành ghế
        cols = cols.filter((c) => c !== colNumber);
      } else {
        // thêm gap
        cols.push(colNumber);
      }

      cols.sort((a, b) => a - b);

      // gộp lại thành gap_index + gap_width
      const merged = [];
      cols.forEach((c) => {
        const last = merged[merged.length - 1];
        if (!last || last.gap_index + last.gap_width !== c) {
          merged.push({ gap_index: c, gap_width: 1 });
        } else {
          last.gap_width += 1;
        }
      });

      const newAsideGap = [...aside_gap];

      if (merged.length === 0) {
        // không còn gap → xoá row
        if (rowIndex !== -1) newAsideGap.splice(rowIndex, 1);
      } else {
        if (rowIndex !== -1) {
          newAsideGap[rowIndex] = {
            gap_row: rowNumber,
            aside: merged,
          };
        } else {
          newAsideGap.push({
            gap_row: rowNumber,
            aside: merged,
          });
        }
      }

      return {
        ...prev,
        asideRoom: {
          ...prev.asideRoom,
          aside_gap: newAsideGap,
        },
      };
    });
  };

  // tính tổng ghế
  const calculateCapacity = () => {
    const totalCells = state.selected.width * state.selected.height;

    let totalGap = 0;

    state.asideRoom?.aside_gap?.forEach((row) => {
      row.aside.forEach((g) => {
        totalGap += g.gap_width;
      });
    });

    return totalCells - totalGap;
  };

  // submit
  const submitData = async () => {
    try {
      setState((prev) => ({ ...prev, isFetch: true }));
      if (state.selected.name === "") {
        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "error",
          title: "Bạn chưa nhập tên phòng!",
          showConfirmButton: false,
          timer: 2000,
          timerProgressBar: true,
        });
        return;
      }

      if (state.selected.width == 0 || state.selected.height == 0) {
        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "error",
          title: "Bạn chưa nhập nhập kích thước phòng!",
          showConfirmButton: false,
          timer: 2000,
          timerProgressBar: true,
        });
        return;
      }

      //   thêm
      if (state.room && Object.keys(state.room).length === 0) {
        const res = await createRoomAPI({
          ...state.selected,
          aside_gap: state.asideRoom.aside_gap,
        });

        if (res.success) {
          Swal.fire({
            toast: true,
            position: "top-end",
            icon: "success",
            title: "Tạo phòng thành công",
            showConfirmButton: false,
            timer: 2000,
            timerProgressBar: true,
          });
          setToggleRoom("rooms");
        }
      }
      //   cập nhật
      else {
      }
    } catch (error) {
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "error",
        title: error?.message
          ? error.message
          : "Có lỗi xảy ra, vui lòng thử lại!",
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
      });
      console.log(error);
    } finally {
      setState((prev) => ({ ...prev, isFetch: false }));
    }
  };

  // lấy thông tin phòng nếu có
  useEffect(() => {
    const getasideRoom = async (room_id) => {
      try {
        const res = await getRoomAsileWithIdAPI(room_id);

        setState((prev) => ({ ...prev, asideRoom: res }));
      } catch (error) {
        console.log(error);
      }
    };

    if (room && Object.keys(room).length > 0) {
      getasideRoom(room.room_id);
      setState((prev) => ({
        ...prev,
        room: room,
        selected: {
          name: room.name,
          width: room.width,
          height: room.height,
          capacity: room.capacity,
        },
      }));
    }
  }, [room]);

  // tính toán lại khi width, height, aside đổi
  useEffect(() => {
    const capacity = calculateCapacity();

    setState((prev) => ({
      ...prev,
      selected: {
        ...prev.selected,
        capacity: Number.isNaN(capacity) ? 0 : capacity,
      },
    }));
  }, [state.selected.width, state.selected.height, state.asideRoom]);

  // lưu cinemaid
  useEffect(() => {
    setState((prev) => ({
      ...prev,
      selected: { ...prev.selected, cinemaId: cinemaId },
    }));
  }, [cinemaId]);

  // kiểm tra nhập kích thước
  const handleSelectSize = (
    number: string,
    name: string,
    maxSeat: number = 15
  ) => {
    // Chỉ cho nhập số
    if (!/^\d*$/.test(number)) return;

    const num = Number(number);

    // Giới hạn ghế tối đa
    if (num > maxSeat) {
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "error",
        title: `Số ghế tối đa là ${maxSeat}`,
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
      });
      return;
    }

    setState((prev) => ({
      ...prev,
      selected: { ...prev.selected, [name]: num },
    }));
  };
  return (
    <div className="bg-white p-2 rounded-sm shadow">
      <div className="flex justify-between">
        <div className={styles.actions}>
          <button
            className={styles.btnBack}
            onClick={() => setToggleRoom("rooms")}
          >
            <FontAwesomeIcon icon={faArrowLeft} />
            <span>Quay lại</span>
          </button>

          <button
            className={styles.btnReset}
            onClick={() => {
              setState((prev) => {
                if (prev.room && Object.keys(prev.room).length > 0) {
                  return { ...prev, selected: prev.room };
                } else {
                  return {
                    ...prev,
                    asideRoom: [],
                    selected: {
                      ...prev.selected,
                      width: 0,
                      height: 0,
                      capacity: 0,
                    },
                  };
                }
              });
            }}
          >
            <FontAwesomeIcon icon={faRotateRight} />
            <span>Đặt lại kích thước</span>
          </button>
        </div>

        <div>
          <button className={styles.btnSubmit} onClick={() => submitData()}>
            {!state.isFetch && (
              <FontAwesomeIcon
                icon={
                  state.room && Object.keys(state.room).length > 0
                    ? faPenToSquare // cập nhật
                    : faPlus // tạo mới
                }
              />
            )}

            <span>
              {state.isFetch
                ? "Đang xử lý..."
                : state.room && Object.keys(state.room).length > 0
                ? "Cập nhật phòng"
                : "Tạo mới phòng"}
            </span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className={`${styles.int_group}`}>
          <label>Tên phòng</label>
          <input
            value={state.selected.name}
            onChange={(e) => {
              setState((prev) => ({
                ...prev,
                selected: { ...prev.selected, name: e.target.value },
              }));
            }}
          />
        </div>
        <div className={`${styles.int_group} ${styles.disabled}`}>
          <label>Số ghế tối đa</label>
          <input value={state.selected.capacity} disabled />
        </div>
        <div className={`${styles.int_group}`}>
          <label>Chiều dài (ghế)</label>
          <input
            value={state.selected.width}
            onChange={(e) => handleSelectSize(e.target.value, "width", 20)}
          />
        </div>
        <div className={`${styles.int_group}`}>
          <label>Chiều rộng (ghế)</label>
          <input
            value={state.selected.height}
            onChange={(e) => handleSelectSize(e.target.value, "height", 15)}
          />
        </div>
      </div>

      {/* render sơ đồ */}
      <div className="flex justify-center">
        <div className={styles.diagram}>
          {Array.from({ length: state.selected.height }).map((_, rowIndex) => {
            const rowNumber = rowIndex + 1;
            const gaps = asideMap[rowNumber] || [];
            let seatNumber = 0;

            return (
              <div key={rowNumber} className={styles.row}>
                {Array.from({ length: state.selected.width }).map(
                  (_, colIndex) => {
                    const colNumber = colIndex + 1;

                    const isGap = gaps.some(
                      (g) =>
                        colNumber >= g.gap_index &&
                        colNumber < g.gap_index + g.gap_width
                    );

                    if (isGap) {
                      return (
                        <div
                          key={`gap-${rowNumber}-${colNumber}`}
                          className={styles.aside}
                          onClick={() => toggleSeat(rowNumber, colNumber)}
                        />
                      );
                    }

                    seatNumber += 1;

                    return (
                      <div
                        key={`seat-${rowNumber}-${seatNumber}`}
                        className={styles.seat}
                        onClick={() => toggleSeat(rowNumber, colNumber)}
                      >
                        {rowNumber}-{seatNumber}
                      </div>
                    );
                  }
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default DiagramRoom;
