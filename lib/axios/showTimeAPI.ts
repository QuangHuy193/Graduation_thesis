import axiosInstance from "./config";

export async function getShowtimeByDateAPI(day: number, id: number) {
  try {
    const response = await axiosInstance.get(
      `/api/showtimes/movie/${id}?day=${day}`
    );
    return response.data.data;
  } catch (error: any) {
    console.error("Error fetching showtimes:", error);
    throw error.response?.data || error;
  }
}

export async function getDateInShowtimeByCinemaMovieAPI(
  id: number,
  cinema_id: number
) {
  try {
    const response = await axiosInstance.get(
      `/api/showtimes/date/movie/${id}?cinema_id=${cinema_id}`
    );
    return response.data.data;
  } catch (error: any) {
    console.error("Error fetching date:", error);
    throw error.response?.data || error;
  }
}

export async function getTimeInShowtimeByCinemaMovieDateAPI(
  movie_id: number,
  cinema_id: number,
  date: Date
) {
  try {
    const response = await axiosInstance.get(
      `/api/showtimes/times?movie_id=${movie_id}&cinema_id=${cinema_id}&date=${date}`
    );
    return response.data.data;
  } catch (error: any) {
    console.error("Error fetching date:", error);
    throw error.response?.data || error;
  }
}

export async function getShowtimeDetailAPI(
  movie_id: number,
  date: Date,
  time_id: number
) {
  try {
    const response = await axiosInstance.get(
      `/api/showtimes/detail?movie_id=${movie_id}&date=${date}&time=${time_id}`
    );
    return response.data.data;
  } catch (error: any) {
    console.error("Error fetching date:", error);
    throw error.response?.data || error;
  }
}
