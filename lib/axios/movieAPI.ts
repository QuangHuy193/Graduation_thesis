import axios from "axios";

export async function getMovieShowingBanerAPI() {
  try {
    const response = await axios.get("/api/movies/showing/banners");

    return response.data.data;
  } catch (error: any) {
    console.error("Error fetching movies:", error);
    throw error.response?.data || error;
  }
}

export async function getMovieUpcommingBanerAPI() {
  try {
    const response = await axios.get("/api/movies/upcoming/banners");

    return response.data.data;
  } catch (error: any) {
    console.error("Error fetching movies:", error);
    throw error.response?.data || error;
  }
}
