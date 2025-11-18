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
export async function deleteMovie(movie_id: number) {
    try {
        const res = await axiosInstance.delete(`/api/movies/admin/delMovie/${movie_id}`);
        console.log("Xoá movie thành công:", res.data);
        return res.data;
    } catch (error: any) {
        console.error("Lỗi khi xoá movie:", error.response?.data || error.message);
        throw error;
    }
}
