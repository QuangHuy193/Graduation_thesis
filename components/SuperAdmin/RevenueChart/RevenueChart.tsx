"use client";
import {
  getRevenueMonthYearAPI,
  getRevenueYearAPI,
} from "@/lib/axios/sadmin/revenueAPI";
import {
  faChartColumn,
  faLineChart,
  faRefresh,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Select } from "antd";
import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts";

function RevenueChart({ selected, setSelected, setType }) {
  const [state, setState] = useState({
    revenue: [],
    chartType: "line", // line | bar
  });

  const monthOptions = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: `Tháng ${i + 1}`,
  }));

  const currentYear = new Date().getFullYear();

  const yearOptions = Array.from(
    { length: currentYear - 2025 + 1 },
    (_, i) => ({
      value: 2025 + i,
      label: `${2025 + i}`,
    })
  );

  useEffect(() => {
    const getRevenueYear = async () => {
      try {
        const res = await getRevenueYearAPI(selected.year);
        setState((prev) => ({ ...prev, revenue: res }));
      } catch (error) {
        console.log(error);
      }
    };

    const getRevenueMonth = async () => {
      try {
        const res = await getRevenueMonthYearAPI(selected.month, selected.year);
        setState((prev) => ({ ...prev, revenue: res }));
      } catch (error) {
        console.log(error);
      }
    };

    if (selected.type === "month") {
      getRevenueMonth();
    } else if (selected.type === "year") {
      getRevenueYear();
    }
  }, [selected, selected.type]);

  // map dữ liệu cho recharts
  const chartData =
    state.revenue.length === 12
      ? state.revenue.map((v, i) => ({
          label: `Tháng ${i + 1}`,
          value: Number(v),
        }))
      : state.revenue.map((v, i) => ({
          label: `${i + 1}`,
          value: Number(v),
        }));

  return (
    <div>
      <div className="flex items-center gap-6 pb-2">
        {/* Nút đổi loại thống kê */}
        <button
          onClick={() => {
            const newType = selected.type === "month" ? "year" : "month";
            setType(newType);
          }}
          className={`px-4 py-2 rounded-lg cursor-pointer transition flex 
            items-center gap-1 ${
              selected.type === "year"
                ? `bg-orange-100 text-orange-700 hover:bg-orange-200 border border-orange-300`
                : `bg-indigo-100 text-indigo-700 hover:bg-indigo-200 border border-indigo-300`
            }`}
        >
          <span>
            Thống kê theo {selected.type === "year" ? "năm" : "tháng"}
          </span>
          <FontAwesomeIcon icon={faRefresh} />
        </button>

        {/* Select tháng */}
        <div className="flex items-center gap-2">
          <span>Tháng:</span>
          <div className="w-32">
            <Select
              disabled={selected.type === "year"}
              value={selected.month}
              options={monthOptions}
              onChange={(v) => setSelected("month", v)}
            />
          </div>
        </div>

        {/* Select năm */}
        <div className="flex items-center gap-2">
          <span>Năm:</span>
          <div className="w-32">
            <Select
              placeholder="Chọn năm"
              value={selected.year}
              options={yearOptions}
              onChange={(v) => setSelected("year", v)}
            />
          </div>
        </div>
      </div>

      {/* tên biểu đồ */}
      <div className="text-center mb-4">
        <h2 className="text-lg font-semibold uppercase tracking-wide text-gray-700">
          {selected.type === "year"
            ? `Biểu đồ tổng doanh thu 12 tháng trong năm ${selected.year}`
            : `Biểu đồ tổng doanh thu các ngày trong tháng ${selected.month}/${selected.year}`}
        </h2>

        <div className="mt-1 h-1 w-20 mx-auto rounded-full bg-blue-500" />
      </div>

      {/* chuyển loại biểu đồ */}
      <div className="flex justify-end">
        <button
          onClick={() =>
            setState((prev) => ({
              ...prev,
              chartType: prev.chartType === "line" ? "bar" : "line",
            }))
          }
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold
          text-gray-800 bg-gray-50 border border-gray-400 rounded-lg shadow
          hover:bg-gray-100 hover:border-gray-500 hover:shadow-md transition-all
          select-none cursor-pointer"
        >
          <FontAwesomeIcon
            icon={state.chartType === "line" ? faChartColumn : faLineChart}
            className="text-gray-700"
          />
          <span>Biểu đồ {state.chartType === "line" ? "cột" : "đường"}</span>
        </button>
      </div>

      {/* ---- Biểu đồ ---- */}
      <div className="">
        <div className="w-full h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            {state.chartType === "line" ? (
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" interval={0} tick={{ fontSize: 10 }} />
                <YAxis
                  tickFormatter={(v) =>
                    v.toLocaleString("vi-VN", {
                      style: "currency",
                      currency: "VND",
                    })
                  }
                  tick={{ fontSize: 11 }}
                />
                <Tooltip
                  labelFormatter={(label) =>
                    state.revenue.length === 12 ? label : `Ngày ${label}`
                  }
                  formatter={(value) => [
                    value.toLocaleString("vi-VN", {
                      style: "currency",
                      currency: "VND",
                    }),
                    "Doanh thu",
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#4f46e5"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            ) : (
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="label"
                  interval={0} // ép hiện TẤT CẢ nhãn, không bỏ bớt
                  tick={{ fontSize: 10 }}
                />
                <YAxis
                  tickFormatter={(v) =>
                    v.toLocaleString("vi-VN", {
                      style: "currency",
                      currency: "VND",
                    })
                  }
                  tick={{ fontSize: 11 }}
                />
                <Tooltip
                  labelFormatter={(label) => {
                    return state.revenue.length === 12
                      ? label // "Tháng 1"
                      : `Ngày ${label}`; // "Ngày 5"
                  }}
                  formatter={(value) => [
                    value.toLocaleString("vi-VN", {
                      style: "currency",
                      currency: "VND",
                    }),
                    "Doanh thu",
                  ]}
                />
                <Bar dataKey="value" fill="#6d66f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export default RevenueChart;
