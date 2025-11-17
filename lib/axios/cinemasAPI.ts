import axiosInstance from "./config";

export async function getCinemasWithCityAPI() {
  try {
    const response = await axiosInstance.get("/api/cinemas");
    return response.data;
  } catch (error: any) {
    console.error("Error fetching cinemas:", error);
    throw error.response?.data || error;
  }
}

export async function getCityAPI() {
  try {
    const response = await axiosInstance.get("/api/cinemas/citys");
    return response.data;
  } catch (error: any) {
    console.error("Error fetching cinemas:", error);
    throw error.response?.data || error;
  }
}
