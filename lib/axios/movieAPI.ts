import axios from "axios";

export async function getMovieShowingBanerAPI() {
  try {
    const response = await axios.get("/api/movies/showing/baners");
    console.log(response.data);
    return response.data.data;
  } catch (error: any) {
    console.error("Error fetching movies:", error);
    throw error.response?.data || error;
  }
}
