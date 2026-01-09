import axiosInstance from "../config";

export async function getAuditShowtimeAPI(limit: number, page: number) {
  try {
    const response = await axiosInstance.get(
      `/api/sadmin/audit/showtime?limit=${limit}&page=${page}`
    );
    return response.data.data;
  } catch (error: any) {
    console.error("Error fetching revenue:", error);
    throw error.response?.data || error;
  }
}
