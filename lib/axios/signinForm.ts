import axios from "axios";
export async function signInForm(formData: any) {
    try {
        const respone = await axios.post("/api/auth/signin", formData, { headers: { "Content-Type": "application/json" } });
        return respone.data;
    } catch (err: any) {
        console.error("Đăng ký thất bại:", err.response?.data || err.message);
        throw err.response?.data || err;
    }
}