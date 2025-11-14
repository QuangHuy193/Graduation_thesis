import axios from "axios";

export async function getCinemasWithCityAPI() {
  try {
    const response = await axios.get("/api/cinemas");
    return response.data;
  } catch (error: any) {
    console.error("Error fetching cinemas:", error);
    throw error.response?.data || error;
  }
}
