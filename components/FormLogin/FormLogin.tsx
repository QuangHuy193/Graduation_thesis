import Link from "next/link";
import Button from "../Button/Button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import { FormAuthProps } from "@/lib/interface/formAuthStateInterface";

function FormLogin({ state, handleToggleVisibility }: FormAuthProps) {
  return (
    <div>
      <form className="px-6 py-7">
        <div className="my-2.5">
          <div className="pb-1">
            Email hoặc số điện thoại <span className="text-red-500">*</span>
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
                                  state.saveLogin === true
                                    ? "bg-orange-300"
                                    : ""
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
    </div>
  );
}

export default FormLogin;
