"use client";
import { getRevenueYearAPI } from "@/lib/axios/sadmin/revenueAPI";
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
} from "recharts";

function RevenueChart({ selected, setSelected }) {
  const [state, setState] = useState({
    chartType: "year",
    revenue: [],
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

    getRevenueYear();
  }, [selected]);

  // map dữ liệu cho recharts
  const chartData =
    state.revenue.length === 12
      ? state.revenue.map((v, i) => ({
          label: `Tháng ${i + 1}`,
          value: v,
        }))
      : state.revenue.map((v, i) => ({
          label: `Ngày ${i + 1}`,
          value: v,
        }));

  return (
    <div>
      <div className="flex items-center gap-6 bg-white pb-2 shadow-md">
        {/* Nút đổi loại thống kê */}
        <div
          onClick={() =>
            setState((prev) => ({
              ...prev,
              chartType: prev.chartType === "month" ? "year" : "month",
            }))
          }
          className="px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer 
               hover:bg-blue-700 transition select-none"
        >
          Thống kê theo {state.chartType === "year" ? "năm" : "tháng"}
        </div>

        {/* Select tháng */}
        <div className="flex items-center gap-2">
          <span>Tháng:</span>
          <div className="w-32">
            <Select
              disabled={state.chartType === "year"}
              placeholder="Chọn tháng"
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

      {/* ---- Biểu đồ ---- */}
      <div className="bg-white  shadow-md">
        <div className="w-full h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="label"
                interval={0} // ép hiện TẤT CẢ nhãn, không bỏ bớt
                tick={{ fontSize: 10 }}
              />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#4f46e5" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export default RevenueChart;
