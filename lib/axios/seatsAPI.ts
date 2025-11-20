import axiosInstance from "./config";

export async function getSeatsWithRoomShowtimeAPI(
  room: number,
  showtime: number
) {
  try {
    const response = await axiosInstance.get(
      `/api/seats/room/showtime?room=${room}&showtime=${showtime}`
    );

    return response.data.data;
  } catch (error: any) {
    console.error("Error fetching movies:", error);
    throw error.response?.data || error;
  }
}
