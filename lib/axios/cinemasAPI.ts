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

export async function getTablePriceAPI(id: number) {
  try {
    const response = await axiosInstance.get(`/api/cinemas/${id}/table-price`);
    return response.data.data;
  } catch (error: any) {
    console.error("Error fetching table price:", error);
    throw error.response?.data || error;
  }
}

export async function getCinemasAPI() {
  try {
    const response = await axiosInstance.get("/api/cinemas/detail");
    return response.data;
  } catch (error: any) {
    console.error("Error fetching cinemas:", error);
    throw error.response?.data || error;
  }
}
