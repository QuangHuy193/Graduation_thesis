import axiosInstance from "../config";
import { MovieFullITF } from "../../interface/movieInterface";
export async function getAllMovies() {
    try {
        const res = await axiosInstance.get("/api/admin/movies/getAllMovies");
        return res.data;
    } catch (error: any) {
        console.error("Error fetching movies:", error);
        throw error.response?.data || error;
    }
}
export async function getAllMoviesEx() {
    try {
        const res = await axiosInstance.get("/api/admin/movies/getAllMovieAct");
        return res.data;
    } catch (error: any) {
        console.error("Error fetching movies:", error);
        throw error.response?.data || error;
    }
}
export async function createMovie(data: MovieFullITF) {
    try {
        const res = await axiosInstance.post("/api/admin/movies/addMovie", data);
        console.log("Thêm phim thành công:", res.data);
        return res.data;
    } catch (error: any) {
        console.error("Lỗi khi thêm phim:", error.response?.data || error.message);
        throw error;
    }
}
export async function deleteMovie(movie_id: number) {
    try {
        const res = await axiosInstance.delete(`/api/admin/movies/delMovie/${movie_id}`);
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
        const res = await axiosInstance.put(`/api/admin/movies/updMovie/${id}`, payload);
        console.log("Xoá movie thành công:", res.data);
        return res.data;
    } catch (error: any) {
        console.error("Lỗi khi cập nhật movie:", error.response?.data || error.message);
        throw error;
    }

}
export async function getMovieWithIdAPI(id: number) {
    try {
        const response = await axiosInstance.get(`/api/admin/movies/getMovie/${id}`);
        // hỗ trợ nhiều dạng response: data có thể là object hoặc mảng
        let data = response?.data?.data ?? response?.data?.movie ?? response?.data ?? null;

        // nếu backend trả mảng rows (vd: [row]) -> lấy phần tử đầu
        if (Array.isArray(data) && data.length > 0) data = data[0];

        return data;
    } catch (error: any) {
        console.error("Error fetching movie:", error);
        const msg =
            error?.response?.data?.message ??
            error?.response?.data?.error ??
            error?.message ??
            "Lỗi khi lấy movie";
        const e = new Error(msg) as any;
        e.status = error?.response?.status ?? null;
        e.original = error;
        throw e;
    }
}


// movies: MovieRow[] from your Excel component
export async function callBulkApi(movies) {
    // Map MovieRow -> RawPayload expected by backend
    const payload = movies.map(m => ({
        name: m.name,
        release_date: m.release_date,   // YYYY-MM-DD
        duration: m.duration,
        age_require: m.age_require,
        country: m.country,            // name or id
        subtitle: m.subtitle,         // name or id
        trailer_url: m.trailer_url,
        genres: m.genres,
        actors: m.actors,
        description: m.description,
        status: m.status,
    }));

    // non-atomic (default)
    const res = await axiosInstance.post("/api/admin/movies/bulk?atomic=true", payload);
    return res.data;

    // atomic example:
    // const res = await axios.post("/api/movies/bulk?atomic=true", payload);
}
