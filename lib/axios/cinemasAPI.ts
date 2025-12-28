import axiosInstance from "./config";

export async function getCinemasWithCityAPI() {
  try {
    const response = await axiosInstance.get("/api/cinemas");
    return response.data;
  } catch (error: any) {
    console.error("Error fetching cinemas:", error);
    throw error.response?.data || error;
  }
}

export async function getCityAPI() {
  try {
    const response = await axiosInstance.get("/api/cinemas/citys");
    return response.data;
  } catch (error: any) {
    console.error("Error fetching cinemas:", error);
    throw error.response?.data || error;
  }
}

export async function getTablePriceAPI(id: number) {
  try {
    const response = await axiosInstance.get(`/api/cinemas/${id}/table-price`);
    return response.data.data;
  } catch (error: any) {
    console.error("Error fetching table price:", error);
    throw error.response?.data || error;
  }
}

export async function getCinemasAPI() {
  try {
    const response = await axiosInstance.get("/api/cinemas/detail");
    return response.data;
  } catch (error: any) {
    console.error("Error fetching cinemas:", error);
    throw error.response?.data || error;
  }
}

// thêm rạp
export async function createCinemasAPI(data: {
  name: string;
  specific_address: string;
  ward: string;
  province: string;
  price_base: number;
}) {
  try {
    const response = await axiosInstance.post("/api/admin/cinema", data);
    return response.data;
  } catch (error: any) {
    console.error("Error create cinemas:", error);
    throw error.response?.data || error;
  }
}

// cập nhật rạp
export async function updateCinemasAPI(data: {
  cinema_id: string | number;
  name: string;
  specific_address: string;
  ward: string;
  province: string;
  price_base: number;
}) {
  try {
    const response = await axiosInstance.put(
      `/api/admin/cinema/${data.cinema_id}`,
      data
    );
    return response.data;
  } catch (error: any) {
    console.error("Error update cinemas:", error);
    throw error.response?.data || error;
  }
}

// hoạt động lại rạp
export async function recoverCinemasAPI(cinema_id: number | string) {
  try {
    const response = await axiosInstance.put(
      `/api/admin/cinema/${cinema_id}/recover`
    );
    return response.data;
  } catch (error: any) {
    console.error("Error update cinemas:", error);
    throw error.response?.data || error;
  }
}

// kiểm tra trước khi xóa
export async function checkBeforeDeleteCinemasAPI(cinema_id: number | string) {
  try {
    const response = await axiosInstance.get(
      `/api/admin/cinema/${cinema_id}/check_before_del`
    );
    return response.data;
  } catch (error: any) {
    console.error("Error update cinemas:", error);
    throw error.response?.data || error;
  }
}
