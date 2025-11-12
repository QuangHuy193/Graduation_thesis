"use client";

import { useState } from "react";
import Link from "next/link";
import Button from "../Button/Button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import { FormAuthProps } from "@/lib/interface/formAuthStateInterface";
import type { ApiResponse } from "@/lib/interface/apiInterface";
import { useRouter } from "next/navigation";
import axios, { AxiosError } from "axios";

export default function FormLogin({
  state,
  handleToggleVisibility,
}: FormAuthProps) {
  const [identifier, setIdentifier] = useState(""); // email or phone
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{
    type: "error" | "success";
    text: string;
  } | null>(null);
  const router = useRouter();

  const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  const isPhone = (v: string) => /^[0-9+\-\s]{7,20}$/.test(v);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);

    const idTrim = identifier.trim();
    if (!idTrim)
      return setMsg({
        type: "error",
        text: "Email hoặc số điện thoại là bắt buộc.",
      });
    if (!password)
      return setMsg({ type: "error", text: "Mật khẩu là bắt buộc." });

    setLoading(true);
    try {
      const payload = {
        identifier: idTrim,
        password,
      };

      const res = await axios.post<ApiResponse<any>>("/api/auth/login", payload, {
        headers: { "Content-Type": "application/json" },
        // withCredentials: true, // bật nếu server set cookie và bạn dùng cookie-based auth
      });

      const data = res.data;

      if (!data || data.success === false) {
        const message = data?.message ?? data?.error ?? "Đăng nhập thất bại";
        setMsg({ type: "error", text: message });
      } else {
        setMsg({ type: "success", text: data?.message ?? "Đăng nhập thành công" });

        if (data.token) {
          try {
            localStorage.setItem("token", data.token);
          } catch { }
        }



        setTimeout(() => {
          // dùng reload để các component đọc token từ storage cập nhật
          window.location.href = "/";
        }, 700);
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const aErr = err as AxiosError;
        const serverData = aErr.response?.data as ApiResponse<any> | undefined;
        const message = serverData?.message ?? serverData?.error ?? aErr.message ?? "Lỗi server";
        setMsg({ type: "error", text: message });
      } else {
        console.error("Login error (non-axios):", err);
        setMsg({ type: "error", text: "Lỗi mạng hoặc server." });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <form className="px-6 py-7" onSubmit={handleSubmit}>
        {msg && (
          <div
            role="alert"
            className={`mb-4 px-3 py-2 rounded text-sm ${msg.type === "error"
              ? "bg-red-100 text-red-800"
              : "bg-green-100 text-green-800"
              }`}
          >
            {msg.text}
          </div>
        )}

        <div className="my-2.5">
          <div className="pb-1">
            Email hoặc số điện thoại <span className="text-red-500">*</span>
          </div>
          <input
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            className="form_input"
          />
        </div>

        <div className="my-2">
          <div className="pb-1">
            Mật khẩu <span className="text-red-500">*</span>
          </div>
          <div className="relative">
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form_input"
              type={state.showPass === true ? "text" : "password"}
            />
            <FontAwesomeIcon
              className="absolute right-1.5 top-1/2 -translate-y-1/2 cursor-pointer"
              icon={state.showPass === true ? faEye : faEyeSlash}
              onClick={() => handleToggleVisibility("password")}
            />
          </div>
        </div>

        <div className="py-2 ">
          <div
            className="flex items-center gap-2 cursor-pointer "
            onClick={() => handleToggleVisibility("saveLogin")}
          >
            <div
              className={`w-3.5 h-3.5  rounded-xs border border-black relative ${state.saveLogin === true ? "bg-orange-300" : ""
                }`}
            >
              {state.saveLogin && (
                <FontAwesomeIcon
                  icon={faCheck}
                  className="text-[11px] absolute"
                />
              )}
            </div>
            <div className="text-[13px]">Lưu đăng nhập</div>
          </div>
        </div>

        <div className="w-full flex justify-end p-2 text-[13px]">
          <Link
            href={"/change-pass"}
            className="underline  hover:text-(--color-purple) "
          >
            Quên mật khẩu?
          </Link>
        </div>

        <Button
          text={loading ? "ĐANG GỬI..." : "ĐĂNG NHẬP"}
          wfull={true}
          type="submit"
          disabled={loading}
        />
      </form>
    </div>
  );
}
