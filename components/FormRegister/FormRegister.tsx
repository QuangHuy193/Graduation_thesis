"use client";
import { POLICY } from "@/lib/constant";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { FormAuthProps } from "@/lib/interface/formAuthStateInterface";
import AlertMessage from "@/components/MessageBox/MessageBox";
import {
  faEye,
  faEyeSlash,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Button from "../Button/Button";
import { scrollToPosition } from "@/lib/function";
import { sendOtp } from "@/lib/axios/sendotpAPI";
import styles from "./FormRegister.module.scss";
import Spinner from "../Spinner/Spinner";
function validateEmailBasic(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
function validatePhoneBasic(phone: string) {
  return /^[0-9]{10}$/.test(phone);
}

function FormRegister({ state, handleToggleVisibility }: FormAuthProps) {
  const [name, setName] = useState("");
  const [birthday, setBirthday] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPolicy, setShowPolicy] = useState(false);

  const [stage, setStage] = useState<"form" | "done">("form");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);

    if (!name.trim()) { setMsg({ type: "error", text: "Họ và tên là bắt buộc." }); scrollToPosition(); return; }
    if (!birthday) { setMsg({ type: "error", text: "Ngày sinh là bắt buộc." }); scrollToPosition(); return; }
    if (!email.trim() || !validateEmailBasic(email.trim().toLowerCase())) { setMsg({ type: "error", text: "Email không hợp lệ." }); scrollToPosition(); return; }
    if (!password || password.length < 8) { setMsg({ type: "error", text: "Mật khẩu phải có ít nhất 8 ký tự." }); scrollToPosition(); return; }
    if (password !== confirm) { setMsg({ type: "error", text: "Mật khẩu xác nhận không khớp." }); scrollToPosition(); return; }
    if (phone.trim() && !validatePhoneBasic(phone.trim())) { setMsg({ type: "error", text: "Số điện thoại không hợp lệ (10 chữ số)." }); scrollToPosition(); return; }
    if (!state.agreeClause) { setMsg({ type: "error", text: "Bạn cần đồng ý điều khoản trước khi đăng ký." }); scrollToPosition(); return; }

    setLoading(true);
    try {
      const payload = {
        name: name.trim(),
        birthday,
        email: email.trim().toLowerCase(),
        phone_number: phone.trim() || undefined,
        password
      };

      const data = await sendOtp(payload);

      if (data.success) {
        router.push(`/verifyotp?email=${encodeURIComponent(payload.email)}`);
        return;
      } else {
        setMsg({ type: "error", text: data.message || "Không thể gửi OTP." });
        return;
      }
    } catch (err) {
      console.error("Send OTP (signup) error:", err);
      setMsg({ type: "error", text: "Lỗi kết nối. Vui lòng thử lại." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <form className="px-6 py-7" onSubmit={handleSubmit} noValidate>
        {/* Họ tên */}
        <div className="my-2.5">
          <div className="pb-1">Họ và tên <span className="text-red-500">*</span></div>
          <input
            className={`${styles.form_input} w-full`}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Họ và tên"
            tabIndex={1}
          />
        </div>

        {/* Ngày sinh */}
        <div className="my-2.5">
          <div className="pb-1">Ngày sinh <span className="text-red-500">*</span></div>
          <input
            type="date"
            className={`${styles.form_input}`}
            value={birthday}
            onChange={(e) => setBirthday(e.target.value)}
            tabIndex={2}
          />
        </div>

        {/* Email */}
        <div className="my-2.5">
          <div className="pb-1">Email <span className="text-red-500">*</span></div>
          <input
            type="email"
            className={`${styles.form_input}`}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-label="Email"
            tabIndex={3}
            required
          />
        </div>

        {/* Số điện thoại */}
        <div className="my-2.5">
          <div className="pb-1">Số điện thoại <span className="text-red-500">*</span></div>
          <input
            className={`${styles.form_input}`}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            tabIndex={4}
            placeholder="Số điện thoại (10 chữ số)"
          />
        </div>

        {/* Mật khẩu */}
        <div className="my-2.5">
          <div className="pb-1">Mật khẩu <span className="text-red-500">*</span></div>
          <div className="relative">
            <input
              type={state.showPass ? "text" : "password"}
              className={`${styles.form_input} pr-10`}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              tabIndex={5}
              placeholder="Mật khẩu (ít nhất 8 ký tự)"
            />
            <button
              type="button"
              className={styles.icon_button}
              onClick={() => handleToggleVisibility("password")}
              aria-label="toggle password visibility"
            >
              <FontAwesomeIcon icon={state.showPass ? faEyeSlash : faEye} />
            </button>
          </div>
        </div>

        {/* Confirm password */}
        <div className="my-2.5">
          <div className="pb-1">Xác nhận mật khẩu <span className="text-red-500">*</span></div>
          <div className="relative">
            <input
              type={state.showConfirmPass ? "text" : "password"}
              className={`${styles.form_input} pr-10`}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              tabIndex={6}
              placeholder="Xác nhận mật khẩu"
            />
            <button
              type="button"
              className={styles.icon_button}
              onClick={() => handleToggleVisibility("comfirmPassword")}
              aria-label="toggle confirm password visibility"
            >
              <FontAwesomeIcon icon={state.showConfirmPass ? faEyeSlash : faEye} />
            </button>
          </div>
        </div>

        {/* Policy */}
        <div className="my-2.5">
          <label className="flex items-start gap-2">
            <input
              type="checkbox"
              checked={state.agreeClause}
              onChange={() => handleToggleVisibility("agree")}
              disabled={stage === "done"}
              className={styles.checkbox}
            />
            <div className="text-sm">
              Tôi đã đọc và đồng ý với{" "}
              <button
                type="button"
                onClick={() => setShowPolicy((s) => !s)}
                className="underline cursor-pointer text-blue-600"
                aria-expanded={showPolicy}
              >
                điều khoản
              </button>
              <div className="text-xs text-gray-500 mt-1">Bạn cần đồng ý để có thể hoàn tất đăng ký.</div>
            </div>
          </label>

          {showPolicy && (
            <div
              className={styles.policyBox}
              dangerouslySetInnerHTML={{ __html: POLICY }}
            />
          )}
        </div>

        {msg && (
          <AlertMessage
            type={msg.type}
            text={msg.text}
            dismissible
            onClose={() => setMsg(null)}
          />
        )}
        {loading ? (
          <div className="py-10 flex justify-center">
            <Spinner text="Đang xử lý..." />
          </div>
        ) : (<Button
          text={stage === "form" ? "Xác nhận & Gửi mã" : "Đã gửi"}
          wfull={true}
          type="submit"
          disabled={loading || stage === "done"}
        />)
        }

      </form>
    </div>
  );
}

export default FormRegister;
