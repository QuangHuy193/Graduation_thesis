import axiosInstance from "./config";

export async function createBookingNoAuth(data: {
  total_price: number;
  showtime_id: number;
  showtime_date: Date;
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

export async function createBookingAuth(data: {
  total_price: number;
  showtime_id: number;
  showtime_date: Date;
  user_id: number;
}) {
  try {
    const { user_id, ...payload } = data;
    const response = await axiosInstance.post(`/api/booking/user/${user_id}`, {
      ...payload,
    });
    return response;
  } catch (error: any) {
    console.error("Error fetching cinemas:", error);
    throw error.response?.data || error;
  }
}
export async function updateBookingToPaid(bookingID: number) {
  try {
    const payload = {
      payment_method: "PAYOS"
    };

    const res = await axiosInstance.put(`/api/booking/${bookingID}`, payload);
    return res.data;
  } catch (error: any) {
    console.error("Error:", error);
    throw error.response?.data || error;
  }
}
