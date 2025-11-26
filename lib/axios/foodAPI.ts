import axiosInstance from "./config";

export async function getFoodAPI() {
  try {
    const res = await axiosInstance.get(`/api/food/all`);
    return res.data.data;
  } catch (error: any) {
    console.error("Error:", error);
    throw error.response?.data || error;
  }
}
