"use client";
import { useEffect, useState } from "react";
import styles from "./DiagramRoom.module.scss";
import {
  checkBeforeUpdateRoomAPI,
  createRoomAPI,
  getRoomAsileWithIdAPI,
  updateRoomAPI,
} from "@/lib/axios/roomAPI";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faArrowsLeftRightToLine,
  faChair,
  faCheck,
  faPenToSquare,
  faPlus,
  faRotateRight,
  faX,
} from "@fortawesome/free-solid-svg-icons";
import Swal from "sweetalert2";
import { numberToLetter, showToast } from "@/lib/function";

function DiagramRoom({ room, setToggleRoom, cinemaId }) {
  const [state, setState] = useState({
    isFetch: {
      addRoom: false,
      updateRoom: false,
    },
    room: {},
    selected: {
      name: "",
      width: 0,
      height: 0,
      capacity: 0,
      cinema_id: -1,
    },
    asideRoom: [],
    asideRoomSelectd: [],
    resetAside: false,
    isChangeAside: false,
    mode: null, // "add-seat" | "add-gap" | null
    isSelecting: false,
    selectedCells: new Set(), // lưu key dạng "row-col"
  });

  // chuẩn hóa aside
  const asideMap = {};
  state.asideRoomSelectd?.aside_gap?.forEach((row) => {
    asideMap[row.gap_row] = row.aside;
  });

  // click bắt đầu chọn ghế
  const handleCellClick = (row, col) => {
    if (!state.mode) return;

    const key = `${row}-${col}`;

    setState((prev) => {
      // click lần 2 → dừng chọn
      if (prev.isSelecting) {
        return { ...prev, isSelecting: false };
      }

      // click lần 1 → bắt đầu chọn
      const newSet = new Set(prev.selectedCells);
      newSet.add(key);

      return {
        ...prev,
        isSelecting: true,
        selectedCells: newSet,
      };
    });
  };

  const handleMouseEnter = (row, col) => {
    if (!state.isSelecting) return;

    const key = `${row}-${col}`;

    setState((prev) => {
      if (prev.selectedCells.has(key)) return prev;

      const newSet = new Set(prev.selectedCells);
      newSet.add(key);

      return { ...prev, selectedCells: newSet };
    });
  };

  // áp dụng thay đổi khi đã chọn
  const applyChange = () => {
    if (!state.mode || state.selectedCells.size === 0) return;

    setState((prev) => {
      let aside_gap = [...(prev.asideRoomSelectd.aside_gap || [])];

      prev.selectedCells.forEach((key) => {
        const [rowNumber, colNumber] = key.split("-").map(Number);

        const rowIndex = aside_gap.findIndex((r) => r.gap_row === rowNumber);

        const currentRow =
          rowIndex !== -1
            ? aside_gap[rowIndex]
            : { gap_row: rowNumber, aside: [] };

        let cols: number[] = [];

        // tách gap → danh sách cột
        currentRow.aside.forEach((g) => {
          for (let i = g.gap_index; i < g.gap_index + g.gap_width; i++) {
            cols.push(i);
          }
        });

        const hasGap = cols.includes(colNumber);

        // === ÁP THEO MODE ===
        if (state.mode === "add-gap" && !hasGap) {
          cols.push(colNumber);
        }

        if (state.mode === "add-seat" && hasGap) {
          cols = cols.filter((c) => c !== colNumber);
        }

        cols.sort((a, b) => a - b);

        // gộp lại
        const merged: any[] = [];
        cols.forEach((c) => {
          const last = merged[merged.length - 1];
          if (!last || last.gap_index + last.gap_width !== c) {
            merged.push({ gap_index: c, gap_width: 1 });
          } else {
            last.gap_width += 1;
          }
        });

        if (merged.length === 0) {
          if (rowIndex !== -1) aside_gap.splice(rowIndex, 1);
        } else {
          if (rowIndex !== -1) {
            aside_gap[rowIndex] = {
              gap_row: rowNumber,
              aside: merged,
            };
          } else {
            aside_gap.push({
              gap_row: rowNumber,
              aside: merged,
            });
          }
        }
      });

      return {
        ...prev,
        asideRoomSelectd: {
          ...prev.asideRoomSelectd,
          aside_gap,
        },
        selectedCells: new Set(), // clear chọn
        isSelecting: false,
      };
    });
  };

  // tính tổng ghế
  const calculateCapacity = () => {
    const totalCells = state.selected.width * state.selected.height;

    let totalGap = 0;

    state.asideRoomSelectd?.aside_gap?.forEach((row) => {
      row.aside.forEach((g) => {
        totalGap += g.gap_width;
      });
    });

    return totalCells - totalGap;
  };

  // call api update
  const callApiUpdateRoom = async (data) => {
    try {
      setState((prev) => ({
        ...prev,
        isFetch: { ...prev.isFetch, updateRoom: true },
      }));
      const res = await updateRoomAPI(data);
      console.log("res", res);
      if (res.success) {
        showToast("success", "Cập nhật thành công");
        setToggleRoom("rooms");
      } else {
        showToast("error", res.message);
      }
    } catch (error) {
      console.log(error);
      showToast("error", "Có lỗi xảy ra, vui lòng thử lại");
    } finally {
      setState((prev) => ({
        ...prev,
        isFetch: { ...prev.isFetch, updateRoom: false },
      }));
    }
  };

  // kiểm tra -> call api cập nhật
  const handleUpdateRoom = async (data) => {
    try {
      const check = await checkBeforeUpdateRoomAPI(data.room_id);
      if (check.data.case === "update") {
        // không có lịch chiếu
        await callApiUpdateRoom(data);
      }
      // có lịch chiếu
      else if (check.data.case === "update_showtime") {
        const confirm = await Swal.fire({
          icon: "warning",
          text: check.message,
          showCancelButton: true,
          confirmButtonText: "TIẾP TỤC",
          cancelButtonText: "HỦY",
          customClass: {
            popup: "popup_alert",
            confirmButton: "btn_alert",
            cancelButton: "btn_alert",
          },
        });

        if (confirm.isConfirmed) {
          //  TODO
        }
      }
      // có lịch chiếu có booking
      else if (check.data.case === "update_showtime_booking") {
        const confirm = await Swal.fire({
          icon: "warning",
          text: check.message,
          showCancelButton: true,
          confirmButtonText: "TIẾP TỤC",
          cancelButtonText: "HỦY",
          customClass: {
            popup: "popup_alert",
            confirmButton: "btn_alert",
            cancelButton: "btn_alert",
          },
        });

        if (confirm.isConfirmed) {
          //  TODO
        }
      }
    } catch (error) {
      console.log(error);
      showToast("error", "Có lỗi xảy ra, vui lòng thử lại!");
    }
  };

  // submit
  const submitData = async () => {
    try {
      setState((prev) => ({
        ...prev,
        isFetch: { ...prev.isFetch, addRoom: true },
      }));
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

      // thêm
      if (state.room && Object.keys(state.room).length === 0) {
        const res = await createRoomAPI({
          ...state.selected,
          aside_gap: state.asideRoomSelectd.aside_gap,
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
        const { name: roomName, room_id, status, ...dataRoom } = state.room;
        const { name: selectedName, ...dataSelect } = state.selected;
        // kiểm tra chỉ đổi mỗi name thì không sao
        const normalize = (obj) => ({
          ...obj,
          cinema_id: Number(obj.cinema_id),
        });
        const a = normalize(dataRoom);
        const b = normalize(dataSelect);
        const isEqual = Object.keys(a).every((key) => a[key] === b[key]);
        const isEqualAside =
          JSON.stringify(state.asideRoom.aside_gap) ===
          JSON.stringify(state.asideRoomSelectd.aside_gap);

        // không đổi gì cả
        if (roomName === selectedName && isEqual && isEqualAside) {
          showToast("info", "Bạn chưa thay đổi bất kì dữ liệu nào của phòng.");
          return;
        }

        if (roomName !== selectedName && isEqual && isEqualAside) {
          // chỉ đổi mỗi tên
          callApiUpdateRoom({
            ...state.selected,
            aside_gap: state.asideRoomSelectd.aside_gap,
            type: 0,
            room_id: state.room.room_id,
          });
        } else {
          handleUpdateRoom({
            ...state.selected,
            aside_gap: state.asideRoomSelectd.aside_gap,
            type: 0,
            room_id: state.room.room_id,
          });
        }
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
      setState((prev) => ({
        ...prev,
        isFetch: { ...prev.isFetch, addRoom: false },
      }));
    }
  };

  // lấy thông tin phòng nếu có
  useEffect(() => {
    const getasideRoomSelectd = async (room_id) => {
      try {
        const res = await getRoomAsileWithIdAPI(room_id);

        setState((prev) => ({
          ...prev,
          asideRoomSelectd: res,
          asideRoom: res,
        }));
      } catch (error) {
        console.log(error);
      }
    };

    if (room && Object.keys(room).length > 0) {
      getasideRoomSelectd(room.room_id);
      setState((prev) => ({
        ...prev,
        room: room,
        selected: {
          name: room.name,
          width: room.width,
          height: room.height,
          capacity: room.capacity,
          cinema_id: room.cinema_id,
        },
      }));
    }
  }, [room, state.resetAside]);

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
  }, [state.selected.width, state.selected.height, state.asideRoomSelectd]);

  // lưu cinemaid
  useEffect(() => {
    setState((prev) => ({
      ...prev,
      selected: { ...prev.selected, cinema_id: cinemaId },
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
                  return {
                    ...prev,
                    selected: {
                      ...prev.selected,
                      name: prev.room.name,
                      width: prev.room.width,
                      height: prev.room.height,
                      capacity: prev.room.capacity,
                    },
                    resetAside: !prev.resetAside,
                    selectedCells: new Set(),
                    mode: "",
                    isSelecting: false,
                  };
                } else {
                  return {
                    ...prev,
                    asideRoomSelectd: [],
                    selected: {
                      ...prev.selected,
                      width: 0,
                      height: 0,
                      capacity: 0,
                    },
                    selectedCells: new Set(),
                    mode: "",
                    isSelecting: false,
                  };
                }
              });
            }}
          >
            <FontAwesomeIcon icon={faRotateRight} />
            <span>Làm mới kích thước</span>
          </button>
        </div>

        <div>
          {state.room && Object.keys(state.room).length > 0 ? (
            <button className={styles.btnSubmit} onClick={() => submitData()}>
              {!state.isFetch.updateRoom && (
                <FontAwesomeIcon icon={faPenToSquare} />
              )}

              <span>
                {state.isFetch.updateRoom ? "Đang xử lý..." : "Cập nhật phòng"}
              </span>
            </button>
          ) : (
            <button className={styles.btnSubmit} onClick={() => submitData()}>
              {!state.isFetch.addRoom && (
                <FontAwesomeIcon
                  icon={
                    faPlus // cập nhật
                  }
                />
              )}

              <span>
                {state.isFetch.addRoom ? "Đang xử lý..." : "Tạo mới phòng"}
              </span>
            </button>
          )}
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

      {/* hướng dẫn */}
      <div
        className="my-2 px-2 py-3 text-[#475569] bg-[#f8fafc] text-[13px] border 
        border-dashed border-[#cbd5e1] rounded-lg flex justify-center"
      >
        <span style={{ fontWeight: 600, color: "#334155" }}>Hướng dẫn: </span>
        <span className="ml-1">
          Chọn chế độ → Click & di chuyển để chọn ô → Click lần nữa để dừng →
          Nhấn <b className="text-green-500">Áp dụng</b> để thay đổi hoặc{" "}
          <b className="text-red-500">Hủy</b> để bỏ các ô đã chọn.
        </span>
      </div>

      {/* thanh action */}
      <div className={`flex justify-between px-2 py-1`}>
        <div className={`${styles.action_bar_item}`}>
          <button
            className={`${styles.action_bar_btn} ${
              state.mode === "add-seat" ? styles.action_bar_btn_select : ""
            }`}
            onClick={() => setState((s) => ({ ...s, mode: "add-seat" }))}
          >
            <FontAwesomeIcon
              icon={faChair}
              className={`text-(--color-yellow)`}
            />
            <span>Thêm ghế</span>
          </button>

          <button
            className={`${styles.action_bar_btn} ${
              state.mode === "add-gap" ? styles.action_bar_btn_select : ""
            }`}
            onClick={() => setState((s) => ({ ...s, mode: "add-gap" }))}
          >
            <FontAwesomeIcon
              icon={faArrowsLeftRightToLine}
              className={`text-gray-500`}
            />
            <span> Thêm khoảng trống</span>
          </button>
        </div>

        <div className={`${styles.action_bar_item}`}>
          <button
            className={`${styles.action_bar_btn}`}
            onClick={() => {
              setState((prev) => ({
                ...prev,
                selectedCells: new Set(),
                isSelecting: false,
              }));
            }}
          >
            <FontAwesomeIcon icon={faX} className={`text-red-500`} />
            <span>Hủy</span>
          </button>
          <button className={`${styles.action_bar_btn}`} onClick={applyChange}>
            <FontAwesomeIcon icon={faCheck} className={`text-green-500`} />
            <span>Áp dụng</span>
          </button>
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

                    const cellKey = `${rowNumber}-${colNumber}`;
                    const isSelected = state.selectedCells?.has(cellKey);

                    const cellClass = [
                      styles.seat, // class chung
                      isGap && styles.aside, // trạng thái hiện tại
                      isSelected && styles.selected, // đang được chọn (preview)
                      state.isSelecting && styles.cursorPointer,
                    ]
                      .filter(Boolean)
                      .join(" ");

                    return (
                      <div
                        key={cellKey}
                        className={cellClass}
                        onClick={() => handleCellClick(rowNumber, colNumber)}
                        onMouseEnter={() =>
                          handleMouseEnter(rowNumber, colNumber)
                        }
                      >
                        {!isGap && (
                          <>
                            {numberToLetter(rowNumber - 1)}-{++seatNumber}
                          </>
                        )}
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
