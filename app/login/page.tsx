"use client";

import Button from "@/components/Button/Button";
import { POLICY } from "@/lib/constant";
import { scrollToPosition } from "@/lib/function";
import {
  faCaretDown,
  faCaretRight,
  faCheck,
  faEye,
  faEyeSlash,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { useState } from "react";

export default function Login() {
  const [state, setState] = useState({
    chosseForm: "login",
    showPass: false,
    saveLogin: false,
    showConfirmPass: false,
    showPolicy: false,
    agreeClause: false,
  });

  const handleToggleVisibility = (name: string) => {
    if (name === "password") {
      setState((prev) => ({
        ...prev,
        showPass: !prev.showPass,
      }));
    } else if (name === "comfirmPassword") {
      setState((prev) => ({
        ...prev,
        showConfirmPass: !prev.showConfirmPass,
      }));
    } else if (name === "policy") {
      setState((prev) => ({
        ...prev,
        showPolicy: !prev.showPolicy,
      }));
    } else if (name === "saveLogin") {
      setState((prev) => ({
        ...prev,
        saveLogin: !prev.saveLogin,
      }));
    } else if (name === "agree") {
      setState((prev) => ({
        ...prev,
        agreeClause: !prev.agreeClause,
      }));
    } else if (name === "form") {
      setState((prev) => ({
        ...prev,
        chosseForm: prev.chosseForm === "login" ? "register" : "login",
      }));
    }
  };

  return (
    <div
      className="pl-32 pr-32 text-black pb-20
      bg-[linear-gradient(180deg,var(--color-blue-black)_0%,#2b3b5e_100%)]"
    >
      <div className="h-(--width-header)"></div>
      <div className="w-[500px]">
        <div className="flex w-full ">
          <div
            className={`flex-1 p-1.5 ${
              state.chosseForm === "login" ? "rounded-tr-sm" : "text-white"
            }`}
            style={{
              backgroundColor:
                state.chosseForm === "login" ? "#f5f5f5" : "inherit",
            }}
          >
            <div
              className={`py-1 font-bold cursor-pointer flex justify-center rounded-sm 
                    w-full ${
                      state.chosseForm !== "login" && "hover:bg-gray-800"
                    }`}
              onClick={() => {
                handleToggleVisibility("form");
              }}
            >
              ĐĂNG NHẬP
            </div>
          </div>
          <div
            className={`flex-1 p-1.5 ${
              state.chosseForm === "register" ? "rounded-tl-sm" : "text-white"
            }`}
            style={{
              backgroundColor:
                state.chosseForm === "register" ? "#f5f5f5" : "inherit",
            }}
          >
            <div
              className={`py-1 font-bold cursor-pointer flex justify-center rounded-sm 
                    w-full ${
                      state.chosseForm !== "register" && "hover:bg-gray-800"
                    }`}
              onClick={() => {
                handleToggleVisibility("form");
              }}
            >
              ĐĂNG KÝ
            </div>
          </div>
        </div>
        <div style={{ backgroundColor: "#f5f5f5" }}>
          {state.chosseForm === "login" && (
            <form className="px-6 py-7">
              <div className="my-2.5">
                <div className="pb-1">
                  Email hoặc số điện thoại{" "}
                  <span className="text-red-500">*</span>
                </div>
                <input className="form_input" />
              </div>
              <div className="my-2">
                <div className="pb-1">
                  Mật khẩu <span className="text-red-500">*</span>
                </div>
                <div className="relative">
                  <input
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
                    className={`w-3.5 h-3.5  rounded-xs border border-black 
                            relative ${
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
                <Link
                  href={"/change-pass"}
                  className="underline  hover:text-(--color-purple) "
                >
                  Quên mật khẩu?
                </Link>
              </div>
              <Button text="ĐĂNG NHẬP" wfull={true} />
            </form>
          )}

          {state.chosseForm === "register" && (
            <form className="px-6 py-7">
              <div className="my-2.5">
                <div className="pb-1">
                  Họ và tên <span className="text-red-500">*</span>
                </div>
                <input className="form_input" />
              </div>
              <div className="my-2.5">
                <div className="pb-1">
                  Ngày sinh <span className="text-red-500">*</span>
                </div>
                <input type="date" className="form_input" />
              </div>
              <div className="my-2.5">
                <div className="pb-1">
                  Email <span className="text-red-500">*</span>
                </div>
                <input type="email" className="form_input" />
              </div>
              <div className="my-2.5">
                <div className="pb-1">
                  Số điện thoại <span className="text-red-500">*</span>
                </div>
                <input className="form_input" />
              </div>
              <div className="my-2">
                <div className="pb-1">
                  Mật khẩu <span className="text-red-500">*</span>
                </div>
                <div className="relative">
                  <input
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
              <div className="my-2">
                <div className="pb-1">
                  Xác nhận mật khẩu <span className="text-red-500">*</span>
                </div>
                <div className="relative">
                  <input
                    className="form_input"
                    type={state.showConfirmPass === true ? "text" : "password"}
                  />
                  <FontAwesomeIcon
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 cursor-pointer"
                    icon={state.showConfirmPass ? faEye : faEyeSlash}
                    onClick={() => handleToggleVisibility("comfirmPassword")}
                  />
                </div>
              </div>
              <div className="my-2.5 font-light ">
                <div
                  className="pb-1 text-[13px] hover:text-blue-500 w-fit cursor-pointer"
                  onClick={() => handleToggleVisibility("policy")}
                >
                  <FontAwesomeIcon
                    icon={state.showPolicy ? faCaretDown : faCaretRight}
                  />{" "}
                  Chính sách bảo mật
                </div>
                {state.showPolicy && (
                  <textarea
                    readOnly
                    className="bg-white w-full h-[150px] mt-1 resize-none 
                    focus:outline-none px-2 py-1 text-[12px]"
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
                    className={`w-3.5 h-3.5  rounded-xs border border-black 
                            relative ${
                              state.agreeClause === true ? "bg-blue-300" : ""
                            }`}
                  >
                    {state.agreeClause && (
                      <FontAwesomeIcon
                        icon={faCheck}
                        className="text-[11px] absolute"
                      />
                    )}
                  </div>
                  <div className="text-[13px]">
                    Khách hàng đã đồng ý các điều khoản, điều kiện của thành
                    viên CineGo
                  </div>
                </div>
              </div>
              <Button text="ĐĂNG KÝ" wfull={true} />
              <div className="flex justify-center text-[12px] pt-2">
                <span>
                  Bạn đã có tài khoản?{" "}
                  <span
                    className="underline cursor-pointer font-semibold
                     hover:text-purple-400"
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
          )}
        </div>
      </div>
    </div>
  );
}
