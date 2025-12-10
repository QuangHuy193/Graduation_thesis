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

export async function createBookingAuth(data: {
  total_price: number;
  showtime_id: number;
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

export async function updateBookingToPaid(bookingID: number, ticket) {
  try {
    const payload = {
      payment_method: "PAYOS",
      ticket: [...ticket],
    };

    const res = await axiosInstance.put(`/api/booking/${bookingID}`, payload);
    return res.data;
  } catch (error: any) {
    console.error("Error:", error);
    throw error.response?.data || error;
  }
}

export async function getBookingHistory(userId) {
  try {
    const res = await axiosInstance.get(`/api/booking/${userId}/history`);
    return res.data.data;
  } catch (err) {
    console.error("Lỗi khi gọi API:", err);
    throw err;
  }
}

export async function cancelBookingAPI(
  booking_id: number | number,
  percent: number
) {
  try {
    const response = await axiosInstance.delete(
      `/api/booking/cancel/${booking_id}`,
      { data: { percent } }
    );
    return response.data;
  } catch (error: any) {
    console.error("Error fetching cinemas:", error);
    throw error.response?.data || error;
  }
}
