"use client";

import { useState } from "react";
import Link from "next/link";
import Button from "../Button/Button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import { FormAuthProps } from "@/lib/interface/formAuthStateInterface";
import type { ApiResponse } from "@/lib/interface/apiInterface";
import { scrollToPosition } from "@/lib/function";
import { useRouter } from "next/navigation";

export default function FormLogin({ state, handleToggleVisibility }: FormAuthProps) {
  const [identifier, setIdentifier] = useState(""); // email or phone
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const router = useRouter();

  const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  const isPhone = (v: string) => /^[0-9+\-\s]{7,20}$/.test(v);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);

    const idTrim = identifier.trim();
    if (!idTrim) return setMsg({ type: "error", text: "Email hoặc số điện thoại là bắt buộc." });
    if (!password) return setMsg({ type: "error", text: "Mật khẩu là bắt buộc." });

    setLoading(true);
    try {
      const payload = {
        identifier: idTrim,
        password,
      };

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      let data: ApiResponse<any> | null = null;
      try {
        data = await res.json();
      } catch {
        setMsg({ type: "error", text: "Server trả về JSON không hợp lệ." });
        setLoading(false);
        return;
      }

      if (!res.ok || data?.success === false) {
        const message = data?.message ?? data?.error ?? `Lỗi (${res.status})`;
        setMsg({ type: "error", text: message });
      } else {
        setMsg({ type: "success", text: data?.message ?? "Đăng nhập thành công" });

        // Save token (client-side). For production prefer HttpOnly cookie.
        if (data?.token) {
          try {
            localStorage.setItem("token", data.token);
          } catch {
            /* ignore storage errors */
          }
        }

        setTimeout(() => {
          window.location.href = "/";
        }, 700);
      }
    } catch (err) {
      console.error("Login error:", err);
      setMsg({ type: "error", text: "Lỗi mạng hoặc server." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <form className="px-6 py-7" onSubmit={handleSubmit}>
        <div className="my-2.5">
          <div className="pb-1">
            Email hoặc số điện thoại <span className="text-red-500">*</span>
          </div>
          <input
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            className="form_input"
            placeholder="Email hoặc số điện thoại"
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
              placeholder="Mật khẩu"
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
              {state.saveLogin && <FontAwesomeIcon icon={faCheck} className="text-[11px] absolute" />}
            </div>
            <div className="text-[13px]">Lưu đăng nhập</div>
          </div>
        </div>

        <div className="w-full flex justify-end p-2 text-[13px]">
          <Link href={"/change-pass"} className="underline  hover:text-(--color-purple) ">
            Quên mật khẩu?
          </Link>
        </div>

        {msg && (
          <div className={`mb-2 text-sm ${msg.type === "error" ? "text-red-300" : "text-green-300"}`}>
            {msg.text}
          </div>
        )}

        <Button text={loading ? "ĐANG GỬI..." : "ĐĂNG NHẬP"} wfull={true} type="submit" disabled={loading} />
      </form>
    </div>
  );
}
