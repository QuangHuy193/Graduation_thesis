import axios from "axios";

export async function getCinemasWithCity() {
  try {
    const response = await axios.get("/api/cinemas");
    return response.data;
  } catch (error) {
    console.error("Error fetching cinemas:", error);
    return [];
  }
}
