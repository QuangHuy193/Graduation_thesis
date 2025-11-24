import axiosInstance from "./config";

export async function createBookingNoAuth(data: {
  total_price: number;
  showtime_id: number;
  name: string;
  phone: string;
  email: string;
}) {
  try {
    const response = await axiosInstance.post("/api/booking", data);
    return response;
  } catch (error: any) {
    console.error("Error fetching cinemas:", error);
    throw error.response?.data || error;
  }
}
