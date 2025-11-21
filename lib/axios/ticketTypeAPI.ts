import axiosInstance from "./config";

export async function getTicketTypeByShowtimeDateAPI(id: number, day: number) {
  try {
    const response = await axiosInstance.get(
      `/api/ticket-type/showtime/${id}?day=${day}`
    );
    return response.data.data;
  } catch (error: any) {
    console.error("Error fetching ticket-type:", error);
    throw error.response?.data || error;
  }
}
