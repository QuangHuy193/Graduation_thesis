import axiosInstance from "../config";

export async function getNameAdminAPI() {
  try {
    const response = await axiosInstance.get(`/api/sadmin/user/admin`);
    return response.data.data;
  } catch (error: any) {
    console.error("Error fetching revenue:", error);
    throw error.response?.data || error;
  }
}
