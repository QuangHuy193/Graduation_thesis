import axiosInstance from "./config";

export async function getTicketByBokingIdAPI(booking_id: number) {
  try {
    const response = await axiosInstance.get(
      `/api/ticket?booking_id=${booking_id}`
    );
    return response.data.data;
  } catch (error: any) {
    console.error("Error fetching ticket:", error);
    throw error.response?.data || error;
  }
}
