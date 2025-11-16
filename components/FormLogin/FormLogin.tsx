"use client";

import { useState } from "react";
import Button from "../Button/Button";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import { FormAuthProps } from "@/lib/interface/formAuthStateInterface";
import type { ApiResponse } from "@/lib/interface/apiInterface";
import AlertMessage from "../MessageBox/MessageBox";
import axios, { AxiosError } from "axios";
import { sendOtp } from "@/lib/axios/sendotpAPI";
import {
  getEmailByPhone,
  GetEmailByPhoneResponse,
} from "@/lib/axios/getEmailByPhone";
import { checkUserStatus } from "@/lib/axios/checkUserStatusAPI";
import { useRouter } from "next/navigation";
import styles from "./FormLogin.module.scss";
import LoadingLink from "../Link/LinkLoading";

export default function FormLogin({
  state,
  handleToggleVisibility,
}: FormAuthProps) {
  const router = useRouter();
  const [identifier, setIdentifier] = useState(""); // email or phone
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [needActivation, setNeedActivation] = useState(false);

  const [msg, setMsg] = useState<{
    type: "error" | "success";
    text: string;
  } | null>(null);

  async function handleActivateNow() {
    setMsg(null);
    let email = identifier.trim();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      try {
        const res = (await getEmailByPhone(
          identifier
        )) as GetEmailByPhoneResponse;
        console.log("getEmailByPhone response:", res);
        if (!res.success || !res.data?.email) {
          setMsg({
            type: "error",
            text: "Không tìm thấy email cho số điện thoại này.",
          });
          return;
        }
        email = res.data.email;
      } catch (err) {
        console.error(err);
        setMsg({
          type: "error",
          text: "Lỗi khi tìm email theo số điện thoại.",
        });
        return;
      }
    }

    setLoading(true);
    try {
      const res = await sendOtp({ email });
      if (res && res.success) {
        router.push(`/verifyotp?email=${encodeURIComponent(email)}`);
        return;
      } else {
        setMsg({
          type: "error",
          text: res?.message ?? "Không thể gửi mã. Vui lòng thử lại.",
        });
      }
    } catch (err: any) {
      setMsg({
        type: "error",
        text: err?.message ?? "Lỗi khi gửi mã. Vui lòng thử lại.",
      });
    } finally {
      setLoading(false);
    }
  }

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
      const payload = { identifier: idTrim, password };

      const loginResp = await axios.post<ApiResponse<any>>(
        "/api/auth/login",
        payload,
        { headers: { "Content-Type": "application/json" } }
      );

      const loginData = loginResp.data;

      if (!loginData || loginData.success === false) {
        const message =
          loginData?.message ?? loginData?.error ?? "Đăng nhập thất bại";
        setMsg({ type: "error", text: message });
        setLoading(false);
        return;
      }

      const userIdRaw = loginData?.data?.user?.user_id ?? null;
      const userId = userIdRaw !== null ? Number(userIdRaw) : NaN;
      if (!userId || Number.isNaN(userId)) {
        setMsg({ type: "error", text: "Không xác định được user_id." });
        setLoading(false);
        return;
      }

      const token = loginData.token ?? null;
      const statusRes = await checkUserStatus(userId);

      if (!statusRes.success) {
        setMsg({
          type: "error",
          text: statusRes.error ?? "Không thể kiểm tra trạng thái người dùng.",
        });
        setLoading(false);
        return;
      }

      if (statusRes.data && !statusRes.data.active) {
        setMsg({ type: "error", text: "Người dùng chưa được kích hoạt." });
        setLoading(false);
        setNeedActivation(true);
        return;
      }

      if (loginData.token) {
        try {
          if (state.saveLogin) {
            localStorage.setItem("token", loginData.token);
          } else {
            sessionStorage.setItem("token", loginData.token);
          }
        } catch (err) {
          console.warn("Storage error:", err);
        }
      }

      setMsg({
        type: "success",
        text: loginData?.message ?? "Đăng nhập thành công",
      });

      setTimeout(() => {
        window.location.href = "/";
      }, 700);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const aErr = err as AxiosError;
        const serverData = aErr.response?.data as ApiResponse<any> | undefined;
        const message =
          serverData?.message ??
          serverData?.error ??
          aErr.message ??
          "Lỗi server";
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
        <div className="flex gap-3 items-center">
          {msg && (
            <div className="flex-2">
              <AlertMessage
                type={msg.type}
                text={msg.text}
                dismissible
                onClose={() => setMsg(null)}
              />
            </div>
          )}

          {needActivation && (
            <div className="flex-1 flex justify-end">
              <Button
                type="button"
                className="text-sm text-blue-600 mb-3"
                onClick={handleActivateNow}
              >
                Kích hoạt ngay
              </Button>
            </div>
          )}
        </div>

        <div className="my-2.5">
          <div className="pb-1">
            Email hoặc số điện thoại <span className="text-red-500">*</span>
          </div>
          <input
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            className={styles.form_input}
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
              className={`${styles.form_input} ${styles.prIcon}`}
              type={state.showPass === true ? "text" : "password"}
            />
            <button
              type="button"
              className={styles.icon_button}
              onClick={() => handleToggleVisibility("password")}
              aria-label="toggle password visibility"
            >
              <FontAwesomeIcon
                icon={state.showPass === true ? faEye : faEyeSlash}
              />
            </button>
          </div>
        </div>

        <div className="py-2 ">
          <div
            className="flex items-center gap-2 cursor-pointer "
            onClick={() => handleToggleVisibility("saveLogin")}
          >
            <div
              className={`w-3.5 h-3.5  rounded-xs border border-black relative ${
                state.saveLogin === true ? "bg-orange-300" : ""
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
          <LoadingLink
            href={"/change-pass"}
            className="underline  hover:text-(--color-purple) "
          >
            Quên mật khẩu?
          </LoadingLink>
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
