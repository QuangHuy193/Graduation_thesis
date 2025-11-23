import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import styles from "./InfoUserCheckout.module.scss";
import { faCheck } from "@fortawesome/free-solid-svg-icons";
import { useState } from "react";
import Link from "next/link";
import Button from "../Button/Button";
import Swal from "sweetalert2";
import { EMAILREGEX, PHONEREGEX } from "@/lib/constant";

function InfoUserCheckout({
  changeStep,
  onSaveUser,
}: {
  changeStep: (step: number) => void;
  onSaveUser?: (formData: {
    name: string;
    phone: string;
    email: string;
    checkAge: boolean;
    checkPolicy: boolean;
  }) => void;
}) {
  const [state, setState] = useState({
    formData: {
      name: "",
      phone: "",
      email: "",
      checkAge: false,
      checkPolicy: false,
    },
    formError: {
      name: "",
      phone: "",
      email: "",
    },
  });

  const validateForm = () => {
    const { name, phone, email, checkAge, checkPolicy } = state.formData;

    // check rỗng
    setState((prev) => ({
      ...prev,
      formError: {
        ...prev.formError,
        name: !name.trim() ? "Vui lòng điền họ và tên" : "",
      },
    }));

    setState((prev) => ({
      ...prev,
      formError: {
        ...prev.formError,
        phone: !phone.trim() ? "Vui lòng nhập số điện thoại" : "",
      },
    }));

    setState((prev) => ({
      ...prev,
      formError: {
        ...prev.formError,
        email: !email.trim() ? "Vui lòng điền email" : "",
      },
    }));

    if (!name.trim() || !phone.trim() || !email.trim()) {
      return false;
    }

    // check hợp lệ dữ liệu
    if (!PHONEREGEX.test(phone)) {
      setState((prev) => ({
        ...prev,
        formError: {
          ...prev.formError,
          phone: "Số điện thoại không hợp lệ",
        },
      }));
      console.log("sdt k");
      return false;
    } else {
      setState((prev) => ({
        ...prev,
        formError: {
          ...prev.formError,
          phone: "",
        },
      }));
    }

    if (!EMAILREGEX.test(email)) {
      setState((prev) => ({
        ...prev,
        formError: {
          ...prev.formError,
          email: "Email không đúng định dạng",
        },
      }));
      return false;
    } else {
      setState((prev) => ({
        ...prev,
        formError: {
          ...prev.formError,
          email: "",
        },
      }));
    }

    // check check
    if (!checkAge) {
      Swal.fire({
        text: "Bạn phải đảm bảo mua vé đúng độ tuổi quy định",
        confirmButtonText: "ĐỒNG Ý",
        buttonsStyling: false,
        customClass: {
          popup: "popup_alert",
          confirmButton: "btn_alert",
        },
      });
      return false;
    }

    if (!checkPolicy) {
      Swal.fire({
        text: "Bạn phải đồng ý với điều khoản của CineGo",
        confirmButtonText: "ĐỒNG Ý",
        buttonsStyling: false,
        customClass: {
          popup: "popup_alert",
          confirmButton: "btn_alert",
        },
      });
      return false;
    }

    return true;
  };

  const handleNext = () => {
    if (validateForm()) {
      // Gọi callback để lưu thông tin lên parent trước khi chuyển bước
      if (onSaveUser) {
        onSaveUser(state.formData);
      }
      changeStep(2);
    }
  };
  return (
    <div>
      <form>
        {/* group input */}
        <div className={`${styles.input_group}`}>
          <label>
            Họ và tên <span>*</span>
          </label>
          <input
            value={state.formData.name}
            onChange={(e) => {
              setState((prev) => ({
                ...prev,
                formData: { ...prev.formData, name: e.target.value },
              }));
            }}
          />
          {state.formError.name !== "" && (
            <span className={`${styles.text_err}`}>{state.formError.name}</span>
          )}
        </div>

        <div className={`${styles.input_group}`}>
          <label>
            Số điện thoại <span>*</span>
          </label>
          <input
            value={state.formData.phone}
            onChange={(e) => {
              setState((prev) => ({
                ...prev,
                formData: { ...prev.formData, phone: e.target.value },
              }));
            }}
          />
          {state.formError.phone !== "" && (
            <span className={`${styles.text_err}`}>
              {state.formError.phone}
            </span>
          )}
        </div>
        <div className={`${styles.input_group}`}>
          <label>
            Email <span>*</span>
          </label>
          <input
            value={state.formData.email}
            onChange={(e) => {
              setState((prev) => ({
                ...prev,
                formData: { ...prev.formData, email: e.target.value },
              }));
            }}
          />
          {state.formError.email !== "" && (
            <span className={`${styles.text_err}`}>
              {state.formError.email}
            </span>
          )}
        </div>

        {/* group check */}
        <div className="flex flex-col gap-1 pb-8">
          <div
            className={`${styles.agree_group} `}
            onClick={() => {
              setState((prev) => ({
                ...prev,
                formData: {
                  ...prev.formData,
                  checkAge: !prev.formData.checkAge,
                },
              }));
            }}
          >
            <span className={`${state.formData.checkAge && "bg-amber-400"}`}>
              {state.formData.checkAge && <FontAwesomeIcon icon={faCheck} />}
            </span>
            <div>Đảm bảo mua vé đúng số tuổi quy định.</div>
          </div>
          <div className={`${styles.agree_group} `}>
            <span
              className={`${state.formData.checkPolicy && "bg-amber-400"}`}
              onClick={() => {
                setState((prev) => ({
                  ...prev,
                  formData: {
                    ...prev.formData,
                    checkPolicy: !prev.formData.checkPolicy,
                  },
                }));
              }}
            >
              {state.formData.checkPolicy && <FontAwesomeIcon icon={faCheck} />}
            </span>
            <div>
              <label
                className="cursor-pointer"
                onClick={() => {
                  setState((prev) => ({
                    ...prev,
                    formData: {
                      ...prev.formData,
                      checkPolicy: !prev.formData.checkPolicy,
                    },
                  }));
                }}
              >
                Đồng ý với
              </label>{" "}
              <u className="hover:text-(--color-yellow)">
                <Link href="/dieu-khoan-chung" target="_blank">
                  điều khoản của Cinestar.
                </Link>
              </u>
            </div>
          </div>
        </div>
        {/* btn tiếp tục */}
        <div className="pb-20" onClick={handleNext}>
          <Button text={"TIẾP TỤC"} wfull={true} text_size="16px" />
        </div>
      </form>
    </div>
  );
}

export default InfoUserCheckout;
