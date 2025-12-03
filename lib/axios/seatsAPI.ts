import axiosInstance from "./config";

export async function getSeatsWithRoomShowtimeAPI(
  room: number,
  showtime: number,
  day: number
) {
  try {
    const response = await axiosInstance.get(
      `/api/seats/room/showtime?room=${room}&showtime=${showtime}&day=${day}`
    );

    return response.data.data;
  } catch (error: any) {
    console.error("Error fetching movies:", error);
    throw error.response?.data || error;
  }
}

export async function lockSeatAPI(seat_id: number, showtime_id: number) {
  try {
    const response = await axiosInstance.post(`/api/seats/lock/`, {
      seat_id,
      showtime_id,
    });

    return response.data;
  } catch (error: any) {
    console.error("Error lock seat:", error);
    throw error.response?.data || error;
  }
}

export async function unlockSeatAPI(seat_id: number, showtime_id: number) {
  try {
    const response = await axiosInstance.post(`/api/seats/unlock/`, {
      seat_id,
      showtime_id,
    });

    return response.data;
  } catch (error: any) {
    console.error("Error unlock seat:", error);
    throw error.response?.data || error;
  }
}
