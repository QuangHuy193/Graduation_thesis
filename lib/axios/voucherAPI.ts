import axiosInstance from "./config";

export async function getVoucherByUserAPI(user_id: number) {
  try {
    const res = await axiosInstance.get(`/api/voucher/user/${user_id}`);
    return res.data.data;
  } catch (error: any) {
    console.error("Error fetching voucher:", error);
    throw error.response?.data || error;
  }
}
