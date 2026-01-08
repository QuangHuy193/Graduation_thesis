import axiosInstance from "../config";

export async function getRevenueYearAPI(year: number) {
  try {
    const response = await axiosInstance.get(
      `/api/sadmin/revenue/year?year=${year}`
    );
    return response.data.data;
  } catch (error: any) {
    console.error("Error fetching revenue:", error);
    throw error.response?.data || error;
  }
}

export async function getRevenueMonthYearAPI(month: number, year: number) {
  try {
    const response = await axiosInstance.get(
      `/api/sadmin/revenue/month?month=${month}&year=${year}`
    );
    return response.data.data;
  } catch (error: any) {
    console.error("Error fetching revenue:", error);
    throw error.response?.data || error;
  }
}

// revenue liên quan phim
export async function getRevenueMovieAPI(year: number, month?: number) {
  try {
    const params = new URLSearchParams();

    params.append("year", year.toString());
    if (month) {
      params.append("month", month.toString());
    }

    const response = await axiosInstance.get(
      `/api/sadmin/revenue/movie?${params.toString()}`
    );
    return response.data.data;
  } catch (error: any) {
    console.error("Error fetching revenue:", error);
    throw error.response?.data || error;
  }
}
