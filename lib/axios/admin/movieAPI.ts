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
export async function updateMovie(id: number, payload: Partial<MovieFullITF>) {
    // PUT hoặc PATCH /api/movies/:id
    try {
        const res = await axiosInstance.put(`/api/movies/admin/updMovie/${id}`, payload);
        console.log("Xoá movie thành công:", res.data);
        return res.data;
    } catch (error: any) {
        console.error("Lỗi khi cập nhật movie:", error.response?.data || error.message);
        throw error;
    }

}
export async function getMovieWithIdAPI(id: number): Promise<MovieFullITF | null> {
    try {
        const response = await axiosInstance.get(`/api/movies/${id}`);
        // hỗ trợ nhiều định dạng response
        const data = response?.data?.data ?? response?.data?.movie ?? response?.data ?? null;
        return data as MovieFullITF | null;
    } catch (error: any) {
        console.error("Error fetching movie:", error);

        // chuẩn hóa message + status
        const msg =
            error?.response?.data?.message ??
            error?.response?.data?.error ??
            error?.message ??
            "Lỗi khi lấy movie";
        const status = error?.response?.status ?? null;

        const e = new Error(msg) as any;
        e.status = status;
        e.original = error;
        throw e;
    }
}