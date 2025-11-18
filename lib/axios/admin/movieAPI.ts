import axiosInstance from "../config";
import { MovieFullITF } from "../../interface/movieInterface";
export async function getAllMovies() {
    try {
        const res = await axiosInstance.get("/api/movies/admin/getAllMovies");
        return res.data;
    } catch (error: any) {
        console.error("Error fetching movies:", error);
        throw error.response?.data || error;
    }
}
export async function createMovie(data: MovieFullITF) {
    try {
        const res = await axiosInstance.post("/api/movies/admin/addMovie", data);
        console.log("Thêm phim thành công:", res.data);
        return res.data;
    } catch (error: any) {
        console.error("Lỗi khi thêm phim:", error.response?.data || error.message);
        throw error;
    }
}