import axiosInstance from "./config";

export async function getPromotionsAPI() {
  try {
    const response = await axiosInstance.get("/api/promotions");
    return response.data.data;
  } catch (error: any) {
    console.error("Error fetching promotion:", error);
    throw error.response?.data || error;
  }
}
