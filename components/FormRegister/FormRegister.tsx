import { POLICY } from "@/lib/constant";
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

function FormRegister({ state, handleToggleVisibility }: FormAuthProps) {
  return (
    <div>
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
                                  state.agreeClause === true
                                    ? "bg-blue-300"
                                    : ""
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
              Khách hàng đã đồng ý các điều khoản, điều kiện của thành viên
              CineGo
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
    </div>
  );
}

export default FormRegister;
