import Button from "@/components/Button/Button";

function ChangePass() {
  return (
    <div className="bg ">
      <div className="h-(--width-header) "></div>
      <div className="w-full flex justify-center">
        <div className="max-w-[500px] text-center">
          <div className="font-bold text-3xl py-1 my-5">QUÊN MẬT KHẨU</div>
          <div className="py-1 mb-5">
            Nhập địa chỉ email của bạn và chúng tôi sẽ gửi cho bạn hướng dẫn để
            tạo mật khẩu mới
          </div>
          <div className="py-1 my-2">
            <form>
              <input
                className="form_input placeholder:text-gray-500 "
                placeholder="Email"
              />
            </form>
          </div>
          <div className="py-1 mb-[100px]">
            <Button text="GỬI MÃ XÁC MINH" wfull={true} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChangePass;
