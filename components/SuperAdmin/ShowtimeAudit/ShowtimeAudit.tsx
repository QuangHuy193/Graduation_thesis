"use client";

import { getAuditShowtimeAPI } from "@/lib/axios/sadmin/auditAPI";
import { useEffect, useState } from "react";
import { Pagination } from "antd";
import styles from "./ShowtimeAudit.module.scss";
import { getNameAdminAPI } from "@/lib/axios/sadmin/userAPI";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRefresh, faX } from "@fortawesome/free-solid-svg-icons";

const getChangedFields = (oldData: any, newData: any) => {
  if (!oldData || !newData) return [];

  return Object.keys({ ...oldData, ...newData }).filter(
    (key) => oldData[key] !== newData[key]
  );
};

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

function ShowtimeAudit() {
  const [state, setState] = useState({
    showtimeAudit: [],
    showtimeAuditDisplay: [],
    total: 0,
    page: 1,
    limit: 10,
    filter: {
      type: "",
      user_name: "",
    },
    adminNames: [],
  });

  useEffect(() => {
    const getNameAdmin = async () => {
      try {
        const res = await getNameAdminAPI();
        setState((prev) => ({
          ...prev,
          adminNames: res,
        }));
      } catch (e) {
        console.log(e);
      }
    };
    getNameAdmin();
  }, []);

  useEffect(() => {
    const getShowtimeAudit = async () => {
      try {
        const res = await getAuditShowtimeAPI(state.limit, state.page);
        // lọc nếu có
        let filter = [];
        if (state.filter.type !== "") {
          filter = res.filter((s) => s.type_audit === state.filter.type);
        }
        if (state.filter.user_name !== "") {
          filter = res.filter((s) => s.user === state.filter.user_name);
        }
        setState((prev) => ({
          ...prev,
          showtimeAudit: res.audits,
          showtimeAuditDisplay: filter.length > 0 ? filter : res,
          total: res.total,
        }));
      } catch (e) {
        console.log(e);
      }
    };

    getShowtimeAudit();
  }, [state.page, state.limit]);

  // lọc
  useEffect(() => {
    let filter = [...state.showtimeAudit];
    if (state.filter.type !== "") {
      filter = filter.filter((s) => s.type_audit === state.filter.type);
      console.log("lọc type", filter);
    }
    if (state.filter.user_name !== "") {
      filter = filter.filter((s) => s.user === state.filter.user_name);
      console.log("lọc name", filter);
    }
    if (state.filter.type !== "" || state.filter.user_name !== "") {
      setState((prev) => ({
        ...prev,
        showtimeAuditDisplay: filter,
      }));
    } else {
      setState((prev) => ({
        ...prev,
        showtimeAuditDisplay: prev.showtimeAudit,
      }));
    }
  }, [state.filter.type, state.filter.user_name]);
  return (
    <div>
      {/* action */}
      <div>
        {/* lọc */}
        <div className="flex gap-2 py-2">
          <div className={`${styles.group_filter}`}>
            <label>Thao tác</label>
            <select
              onChange={(e) => {
                setState((prev) => ({
                  ...prev,
                  filter: {
                    ...prev.filter,
                    type: e.target.value,
                  },
                }));
              }}
              value={state.filter.type}
            >
              <option value="">Tất cả</option>
              <option value="create">Thêm mới</option>
              <option value="update">Cập nhật</option>
              <option value="delete">Xóa</option>
            </select>
          </div>
          <div className={`${styles.group_filter}`}>
            <label>Người thao tác</label>
            <select
              onChange={(e) => {
                setState((prev) => ({
                  ...prev,
                  filter: {
                    ...prev.filter,
                    user_name: e.target.value,
                  },
                }));
              }}
              value={state.filter.user_name}
            >
              <option value="">Không lọc</option>
              {state.adminNames.length > 0 &&
                state.adminNames.map((n) => (
                  <option key={n.name} value={n.name}>
                    {n.name}
                  </option>
                ))}
            </select>
          </div>
          {(state.filter.type !== "" || state.filter.user_name !== "") && (
            <button
              className="flex items-center text-red-400 cursor-pointer"
              onClick={() =>
                setState((prev) => ({
                  ...prev,
                  filter: {
                    type: "",
                    user_name: "",
                  },
                }))
              }
            >
              <FontAwesomeIcon icon={faX} />
              <span>Hủy lọc</span>
            </button>
          )}
        </div>
      </div>

      {/* content */}
      <div>
        <div
          className="grid grid-cols-[2fr_4fr_2.5fr_2fr] bg-slate-100 text-slate-800
            font-semibold text-sm px-2 py-3 border-b"
        >
          <div className="flex items-center gap-2">🛠 Thao tác</div>
          <div className="flex items-center gap-2">🔄 Thay đổi</div>
          <div className="flex items-center gap-2">⏰ Tại thời điểm</div>
          <div className="flex items-center gap-2">👤 Người thao tác</div>
        </div>

        {state.showtimeAuditDisplay.length > 0 ? (
          state.showtimeAuditDisplay.map((s, ind) => {
            const changedFields = getChangedFields(s.old_data, s.new_data);

            return (
              <div
                key={ind}
                className="grid grid-cols-[2fr_4fr_2.5fr_2fr] items-start border-b py-3 px-2 text-sm"
              >
                {/* loại */}
                <div>
                  <span
                    className={`inline-block rounded-full px-3 py-1 font-medium
              ${
                s.type_audit === "create"
                  ? "bg-green-100 text-green-700"
                  : s.type_audit === "update"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-red-100 text-red-700"
              }`}
                  >
                    {s.type_audit === "update"
                      ? "Cập nhật"
                      : s.type_audit === "create"
                      ? "Thêm mới"
                      : "Xóa"}
                  </span>
                </div>

                {/* thay đổi */}
                <div className="space-y-1">
                  {changedFields.length === 0 ? (
                    <span className="italic text-gray-400">
                      Không có thay đổi
                    </span>
                  ) : (
                    changedFields.map((key) => (
                      <div key={key} className="flex gap-1">
                        <span className="font-semibold text-gray-700">
                          {key === "movie" && "Phim"}
                          {key === "room" && "Phòng"}
                          {key === "screen_time" && "Giờ chiếu"}
                        </span>
                        :
                        <span className="text-red-500 ml-1">
                          {s.old_data[key]}
                        </span>
                        <span className="mx-1 text-gray-400">→</span>
                        <span className="text-green-600">
                          {s.new_data[key]}
                        </span>
                      </div>
                    ))
                  )}
                </div>

                {/* thời gian */}
                <div className="text-gray-600">{formatDate(s.created_at)}</div>

                {/* user */}
                <div className="font-medium text-gray-800">{s.user}</div>
              </div>
            );
          })
        ) : (
          <div className="italic text-gray-400 flex justify-center py-5">
            Không có dữ liệu
          </div>
        )}

        {/* phân trang */}
        <div className="flex justify-end mt-4">
          <Pagination
            current={state.page}
            pageSize={state.limit}
            total={state.total}
            showSizeChanger
            pageSizeOptions={[10, 20, 50]}
            onChange={(p, ps) => {
              setState((prev) => ({ ...prev, page: p, limit: ps }));
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default ShowtimeAudit;
