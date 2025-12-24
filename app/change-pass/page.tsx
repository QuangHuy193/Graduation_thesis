"use client"
import Button from "@/components/Button/Button";
import { useState } from "react";
import { EMAILREGEX } from "@/lib/constant";
import { forgotPassword } from "@/lib/axios/userAPI";
import Swal from "sweetalert2";
import { useRouter } from "next/navigation";
function ChangePass() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      await Swal.fire("Thông báo", "Vui lòng nhập email", "error");
      return;
    }
    if (!EMAILREGEX.test(email)) {
      await Swal.fire("Thông báo", "Email không hợp lệ", "error");
      return;
    }
    try {
      setLoading(true);
      const res = await forgotPassword(email);
      if (res?.success) {
        await Swal.fire("Thông báo", "Đặt lại mật khẩu thành công. Vui lòng kiểm tra email", "success");
        router.push("/login");
      }
    } catch (error) {
      console.log("Lỗi: ", error);
    } finally {
      setLoading(false);
    }
  }
  return (
    <div className="bg ">
      <div className="h-(--width-header) "></div>
      <div className="w-full flex justify-center">
        <div className="max-w-[500px] text-center">
          <div className="font-bold text-3xl py-1 my-5">QUÊN MẬT KHẨU</div>
          <div className="py-1 mb-5">
            Nhập địa chỉ email của bạn và chúng tôi sẽ gửi cho bạn mật khẩu mới
          </div>
          <form onSubmit={handleSubmit}>
            <input
              type="email"
              className="form_input placeholder:text-gray-500 text-black"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <div className="py-5 mb-[100px]">
              <Button
                text={loading ? "ĐANG GỬI..." : "GỬI MÃ XÁC MINH"}
                wfull
                type="submit"
                disabled={loading}
              />
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ChangePass;
