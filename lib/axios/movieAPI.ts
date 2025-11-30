import axiosInstance from "./config";

export async function getMovieShowingAllAPI() {
  try {
    const response = await axiosInstance.get("/api/movies/showing/all");
    return response.data.data;
  } catch (error: any) {
    console.error("Error fetching movies:", error);
    throw error.response?.data || error;
  }
}

export async function getMovieUpcommingAllAPI() {
  try {
    const response = await axiosInstance.get("/api/movies/upcoming/all");
    return response.data.data;
  } catch (error: any) {
    console.error("Error fetching movies:", error);
    throw error.response?.data || error;
  }
}

export async function getMovieShowingBanerAPI() {
  try {
    const response = await axiosInstance.get("/api/movies/showing/banners");
    return response.data.data;
  } catch (error: any) {
    console.error("Error fetching movies:", error);
    throw error.response?.data || error;
  }
}

export async function getMovieUpcommingBanerAPI() {
  try {
    const response = await axiosInstance.get("/api/movies/upcoming/banners");

    return response.data.data;
  } catch (error: any) {
    console.error("Error fetching movies:", error);
    throw error.response?.data || error;
  }
}

export async function getMovieWithIdAPI(id: number) {
  try {
    const response = await axiosInstance.get(`/api/movies/${id}`);

    return response.data.data;
  } catch (error: any) {
    console.error("Error fetching movies:", error);
    throw error.response?.data || error;
  }
}

export async function getMovieWithCinemaIdAPI(id: number) {
  try {
    const response = await axiosInstance.get(`/api/movies/cinema/${id}`);

    return response.data.data;
  } catch (error: any) {
    console.error("Error fetching movies:", error);
    throw error.response?.data || error;
  }
}

export async function getMovieListAPI() {
  try {
    const response = await axiosInstance.get(`/api/movies/list`);

    return response.data;
  } catch (error: any) {
    console.error("Error fetching movies:", error);
    throw error.response?.data || error;
  }
}
