
import axiosInstance from "./config";
export async function signInForm(formData: any) {
    try {
        // const respone = await axios.post("/api/auth/login", formData, { headers: { "Content-Type": "application/json" } });
        const respone = await axiosInstance.post("/api/auth/login", formData);
        return respone.data;
    } catch (err: any) {
        console.error("Đăng ký thất bại:", err.response?.data || err.message);
        throw err.response?.data || err;
    }
}