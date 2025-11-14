"use client";

import FormLogin from "@/components/FormLogin/FormLogin";
import FormRegister from "@/components/FormRegister/FormRegister";
import { useState } from "react";

export default function Register() {
  const [state, setState] = useState({
    chosseForm: "register",
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
            <FormLogin
              state={state}
              handleToggleVisibility={handleToggleVisibility}
            />
          )}

          {state.chosseForm === "register" && (
            <FormRegister
              state={state}
              handleToggleVisibility={handleToggleVisibility}
            />
          )}
        </div>
      </div>
    </div>
  );
}
