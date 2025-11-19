import axiosInstance from "./config";

export async function getRoomAsileWithIdAPI(id: number) {
  try {
    const response = await axiosInstance.get(`/api/rooms/asile/${id}`);

    return response.data.data;
  } catch (error: any) {
    console.error("Error fetching movies:", error);
    throw error.response?.data || error;
  }
}
