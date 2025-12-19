import axiosInstance from "./config";

export async function getRoomAsileWithIdAPI(id: number) {
  try {
    const response = await axiosInstance.get(`/api/rooms/asile/${id}`);

    return response.data.data;
  } catch (error: any) {
    console.error("Error fetching aside:", error);
    throw error.response?.data || error;
  }
}

export async function getAllRoomInCinemaAPI(id: number) {
  try {
    const response = await axiosInstance.get(`/api/admin/rooms/cinema/${id}`);

    return response.data.data;
  } catch (error: any) {
    console.error("Error fetching room:", error);
    throw error.response?.data || error;
  }
}
