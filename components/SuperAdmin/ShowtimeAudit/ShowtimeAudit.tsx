"use client";

import { getAuditShowtimeAPI } from "@/lib/axios/sadmin/auditAPI";
import { useEffect, useState } from "react";
import { Pagination } from "antd";

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
    total: 0,
    page: 1,
    limit: 10,
  });

  useEffect(() => {
    const getShowtimeAudit = async () => {
      try {
        const res = await getAuditShowtimeAPI(state.limit, state.page);
        console.log(res);
        setState((prev) => ({
          ...prev,
          showtimeAudit: res.audits,
          total: res.total,
        }));
      } catch (e) {
        console.log(e);
      }
    };

    getShowtimeAudit();
  }, [state.page, state.limit]);
  return (
    <div>
      {/* content */}
      <div
        className="
    grid grid-cols-[2fr_4fr_2.5fr_2fr]
    bg-slate-100
    text-slate-800
    font-semibold
    text-sm
    px-2
    py-3
    border-b
  "
      >
        <div className="flex items-center gap-2">🛠 Thao tác</div>
        <div className="flex items-center gap-2">🔄 Thay đổi</div>
        <div className="flex items-center gap-2">⏰ Tại thời điểm</div>
        <div className="flex items-center gap-2">👤 Người thao tác</div>
      </div>

      {state.showtimeAudit.length > 0 &&
        state.showtimeAudit.map((s, ind) => {
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
                      <span className="text-green-600">{s.new_data[key]}</span>
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
        })}

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
  );
}

export default ShowtimeAudit;
