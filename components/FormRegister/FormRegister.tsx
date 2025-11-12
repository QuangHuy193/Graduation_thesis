import { POLICY } from "@/lib/constant";
import { useState } from "react";
import { FormAuthProps } from "@/lib/interface/formAuthStateInterface";
import {
  faCaretDown,
  faCaretRight,
  faCheck,
  faEye,
  faEyeSlash,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Button from "../Button/Button";
import { scrollToPosition } from "@/lib/function";

function validateEmailBasic(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePhoneBasic(phone: string) {
  return /^[0-9]{10}$/.test(phone);
}

function FormRegister({ state, handleToggleVisibility }: FormAuthProps) {
  const [name, setName] = useState("");
  const [birthday, setBirthday] = useState(""); // "YYYY-MM-DD"
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "error" | "success"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);

    // client-side validation
    if (!name.trim()) {
      setMsg({ type: "error", text: "Họ và tên là bắt buộc." });
      scrollToPosition();
      return;
    }
    if (!birthday) {
      setMsg({ type: "error", text: "Ngày sinh là bắt buộc." });
      scrollToPosition();
      return;
    }
    // optional: validate birthday format (YYYY-MM-DD)
    if (Number.isNaN(new Date(birthday).getTime())) {
      setMsg({ type: "error", text: "Ngày sinh không hợp lệ." });
      scrollToPosition();
      return;
    }

    if (!email.trim() || !validateEmailBasic(email.trim().toLowerCase())) {
      setMsg({ type: "error", text: "Email không hợp lệ." });
      scrollToPosition();
      return;
    }

    if (!password || password.length < 8) {
      setMsg({ type: "error", text: "Mật khẩu phải có ít nhất 8 ký tự." });
      scrollToPosition();
      return;
    }

    if (password !== confirm) {
      setMsg({ type: "error", text: "Mật khẩu xác nhận không khớp." });
      scrollToPosition();
      return;
    }

    if (phone.trim() && !validatePhoneBasic(phone.trim())) {
      setMsg({ type: "error", text: "Số điện thoại không hợp lệ (10 chữ số)." });
      scrollToPosition();
      return;
    }

    // check user agreed terms (assuming state.agreeClause is provided from parent)
    if (!state.agreeClause) {
      setMsg({ type: "error", text: "Bạn cần đồng ý điều khoản trước khi đăng ký." });
      scrollToPosition();
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name: name.trim(),
        birthday, // "YYYY-MM-DD"
        email: email.trim().toLowerCase(),
        phone_number: phone.trim() || undefined,
        password,
      };

      const res = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      // Try parse JSON safely
      let data;
      try {
        data = await res.json();
      } catch (parseErr) {
        setMsg({ type: "error", text: "Server trả về JSON không hợp lệ." });
        setLoading(false);
        return;
      }

      if (!res.ok) {
        const message = data?.message ?? data?.error ?? `Lỗi server (${res.status})`;
        setMsg({ type: "error", text: message });
      } else {
        if (data?.success === false) {
          setMsg({ type: "error", text: data?.message ?? data?.error ?? "Đăng ký thất bại" });
        } else {
          setMsg({ type: "success", text: data?.message ?? "Đăng ký thành công" });
          // reset form
          setName("");
          setBirthday("");
          setEmail("");
          setPhone("");
          setPassword("");
          setConfirm("");

          setTimeout(() => {
            handleToggleVisibility("form");
            scrollToPosition();
          }, 900);
        }
      }
    } catch (err) {
      console.error("Register error:", err);
      setMsg({ type: "error", text: "Lỗi mạng hoặc server." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <form className="px-6 py-7" onSubmit={handleSubmit} noValidate>


        <div className="my-2.5">
          <div className="pb-1">
            Họ và tên <span className="text-red-500">*</span>
          </div>
          <input
            className="form_input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-label="Họ và tên"
            required
          />
        </div>

        <div className="my-2.5">
          <div className="pb-1">
            Ngày sinh <span className="text-red-500">*</span>
          </div>
          <input
            type="date"
            className="form_input"
            value={birthday}
            onChange={(e) => setBirthday(e.target.value)}
            aria-label="Ngày sinh"
            required
          />
        </div>

        <div className="my-2.5">
          <div className="pb-1">
            Email <span className="text-red-500">*</span>
          </div>
          <input
            type="email"
            className="form_input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-label="Email"
            required
          />
        </div>

        <div className="my-2.5">
          <div className="pb-1">
            Số điện thoại <span className="text-red-500">*</span>
          </div>
          <input
            className="form_input"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            aria-label="Số điện thoại"
            placeholder="0987654321"
          />
        </div>

        <div className="my-2">
          <div className="pb-1">
            Mật khẩu <span className="text-red-500">*</span>
          </div>
          <div className="relative">
            <input
              className="form_input"
              type={state.showPass === true ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-label="Mật khẩu"
              required
            />
            <FontAwesomeIcon
              className="absolute right-1.5 top-1/2 -translate-y-1/2 cursor-pointer"
              icon={state.showPass === true ? faEye : faEyeSlash}
              onClick={() => handleToggleVisibility("password")}
            />
          </div>
        </div>

        <div className="my-2">
          <div className="pb-1">
            Xác nhận mật khẩu <span className="text-red-500">*</span>
          </div>
          <div className="relative">
            <input
              className="form_input"
              type={state.showConfirmPass === true ? "text" : "password"}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              aria-label="Xác nhận mật khẩu"
              required
            />
            <FontAwesomeIcon
              className="absolute right-1.5 top-1/2 -translate-y-1/2 cursor-pointer"
              icon={state.showConfirmPass ? faEye : faEyeSlash}
              // giữ nguyên key "comfirmPassword" nếu parent đang dùng key này
              onClick={() => handleToggleVisibility("comfirmPassword")}
            />
          </div>
        </div>

        <div className="my-2.5 font-light ">
          <div
            className="pb-1 text-[13px] hover:text-blue-500 w-fit cursor-pointer"
            onClick={() => handleToggleVisibility("policy")}
          >
            <FontAwesomeIcon icon={state.showPolicy ? faCaretDown : faCaretRight} /> Chính sách bảo mật
          </div>
          {state.showPolicy && (
            <textarea
              readOnly
              className="bg-white w-full h-[150px] mt-1 resize-none focus:outline-none px-2 py-1 text-[12px]"
              value={POLICY}
            />
          )}
        </div>

        <div className="py-2">
          <div
            className="flex items-center gap-2 cursor-pointer "
            onClick={() => handleToggleVisibility("agree")}
          >
            <div
              className={`w-3.5 h-3.5 rounded-xs border border-black relative ${state.agreeClause === true ? "bg-blue-300" : ""}`}
              aria-hidden
            >
              {state.agreeClause && (
                <FontAwesomeIcon icon={faCheck} className="text-[11px] absolute" />
              )}
            </div>
            <div className="text-[13px]">
              Khách hàng đã đồng ý các điều khoản, điều kiện của thành viên CineGo
            </div>
          </div>
        </div>
        {msg && (
          <div
            role="alert"
            className={`mb-4 px-3 py-2 rounded text-sm ${msg.type === "error" ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}`}
          >
            {msg.text}
          </div>
        )}
        <Button text="ĐĂNG KÝ" wfull={true} type="submit" disabled={loading} />
        <div className="flex justify-center text-[12px] pt-2">
          <span>
            Bạn đã có tài khoản?{" "}
            <span
              className="underline cursor-pointer font-semibold hover:text-purple-400"
              onClick={() => {
                handleToggleVisibility("form");
                scrollToPosition();
              }}
            >
              Đăng nhập
            </span>
          </span>
        </div>
      </form>
    </div>
  );
}

export default FormRegister;
