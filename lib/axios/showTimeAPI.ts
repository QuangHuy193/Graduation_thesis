import axiosInstance from "./config";

export async function getShowtimeByDateAPI(day: number, id: number) {
  try {
    const response = await axiosInstance.get(
      `/api/showtimes/movie/${id}?day=${day}`
    );
    return response.data.data;
  } catch (error: any) {
    console.error("Error fetching showtimes:", error);
    throw error.response?.data || error;
  }
}
