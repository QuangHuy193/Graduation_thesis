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
export async function insertPictureToFood(payload: { url: string; target_id: number; public_id: string }) {
  try {
    const res = await axiosInstance.post(`/api/cloudinary/saveToFood`, payload);
    return res.data;
  } catch (error) {
    throw error;
  }
}