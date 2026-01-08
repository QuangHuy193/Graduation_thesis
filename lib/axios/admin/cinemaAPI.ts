import axiosInstance from "../config";

export const getAllCinemas = async () => {
  try {
    const res = await axiosInstance.get("/api/admin/cinema/getAllCinemas");
    return res.data;
  } catch (err) {
    console.error("Error fetching cinemas:", err);
    return null;
  }
};

export const deleteCinemaAPI = async (cinema_id, type) => {
  try {
    const res = await axiosInstance.delete(`/api/admin/cinema/${cinema_id}`, {
      data: { type },
    });
    return res.data;
  } catch (err) {
    console.error("Error fetching cinemas:", err);
    return null;
  }
};
export const getCinemaScreeningAPI = async () => {
  try {
    const res = await axiosInstance.get("/api/admin/cinema/getCinemaScreening");
    return res.data;
  } catch (error) {
    return null;
  }
};