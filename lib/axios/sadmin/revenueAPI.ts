import axiosInstance from "../config";

export async function getRevenueYearAPI(year: number) {
  try {
    const response = await axiosInstance.get(
      `/api/sadmin/revenue/year?year=${year}`
    );
    return response.data.data;
  } catch (error: any) {
    console.error("Error fetching cinemas:", error);
    throw error.response?.data || error;
  }
}
