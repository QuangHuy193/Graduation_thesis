import axiosInstance from "../config";

export async function getScreenings() {
  try {
    const res = await axiosInstance.get(
      "/api/admin/movie_screening/getAllScreen"
    );
    return res.data.data || [];
  } catch (error) {
    console.error("Lỗi khi gọi API countries:", error);
    throw error;
  }
}

export async function createScreeningsAPI(data: {
  start_time: string;
  end_time: string;
}) {
  try {
    const res = await axiosInstance.post("/api/admin/movie_screening", data);
    return res.data;
  } catch (error) {
    console.error("Lỗi khi gọi API createScreeningsAPI:", error);
    throw error;
  }
}

export async function updateScreeningsAPI(data: {
  movie_screen_id: number | string;
  start_time: string;
  end_time: string;
}) {
  try {
    const res = await axiosInstance.put(
      `/api/admin/movie_screening/${data.movie_screen_id}`,
      { ...data }
    );
    return res.data;
  } catch (error) {
    console.error("Lỗi khi gọi API updateScreeningsAPI:", error);
    throw error;
  }
}

export async function deleteScreeningsAPI(movie_screen_id: number | string) {
  try {
    const res = await axiosInstance.delete(
      `/api/admin/movie_screening/${movie_screen_id}`
    );
    return res.data;
  } catch (error) {
    console.error("Lỗi khi gọi API deleteScreeningsAPI:", error);
    throw error;
  }
}
