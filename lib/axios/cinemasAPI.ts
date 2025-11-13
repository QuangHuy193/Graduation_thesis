import axios from "axios";

export async function getCinemasWithCityAPI() {
  try {
    const response = await axios.get("/api/cinemas");
    return response;
  } catch (error) {
    console.error("Error fetching cinemas:", error);
    return [];
  }
}
