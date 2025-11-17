import axiosInstance from "../config";
export async function getAllMovies() {
    try {
        const res = await axiosInstance.get("/api/movies/admin/getAllMovies");
        return res.data;
    } catch (error: any) {
        console.error("Error fetching movies:", error);
        throw error.response?.data || error;
    }
}
// export async function getCinemasWithCityAPI() {
//   try {
//     const response = await axiosInstance.get("/api/cinemas");
//     return response.data;
//   } catch (error: any) {
//     console.error("Error fetching cinemas:", error);
//     throw error.response?.data || error;
//   }
// }