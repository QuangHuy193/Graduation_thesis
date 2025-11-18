import axiosInstance from "./config";

export async function getShowtimeByDateAPI(day: number) {
  try {
    const response = await axiosInstance.get(`/api/showtimes/date?day=${day}`);
    return response.data.data;
  } catch (error: any) {
    console.error("Error fetching showtimes:", error);
    throw error.response?.data || error;
  }
}
