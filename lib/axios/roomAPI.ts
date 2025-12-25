import axiosInstance from "./config";

export async function getRoomAsileWithIdAPI(id: number) {
  try {
    const response = await axiosInstance.get(`/api/rooms/asile/${id}`);

    return response.data.data;
  } catch (error: any) {
    console.error("Error fetching aside:", error);
    throw error.response?.data || error;
  }
}

export async function getAllRoomInCinemaAPI(id: number) {
  try {
    const response = await axiosInstance.get(`/api/admin/rooms/cinema/${id}`);

    return response.data.data;
  } catch (error: any) {
    console.error("Error fetching room:", error);
    throw error.response?.data || error;
  }
}

//tạo phòng
export async function createRoomAPI(data: {
  name: string;
  width: string | number;
  height: string | number;
  capacity: number;
  cinema_id: number;
  aside_gap: [];
}) {
  try {
    console.log(data);
    const response = await axiosInstance.post(`/api/admin/rooms`, { ...data });

    return response.data;
  } catch (error: any) {
    console.error("Error fetching room:", error);
    throw error.response?.data || error;
  }
}

// kiểm tra trước khi xóa phòng
export async function checkBeforeDeleteRoomAPI(id: number) {
  try {
    const response = await axiosInstance.get(
      `/api/admin/rooms/${id}/check_before_del`
    );

    return response.data;
  } catch (error: any) {
    console.error("Error fetching room:", error);
    throw error.response?.data || error;
  }
}

// xóa phòng
export async function deleteRoomAPI(id: number, type: number = 0) {
  try {
    const response = await axiosInstance.delete(`/api/admin/rooms/${id}`, {
      data: { type },
    });

    return response.data;
  } catch (error: any) {
    console.error("Error fetching room:", error);
    throw error.response?.data || error;
  }
}

// khôi phục phòng
export async function recoverRoomAPI(id: number) {
  try {
    const response = await axiosInstance.put(`/api/admin/rooms/recover/${id}`);

    return response.data;
  } catch (error: any) {
    console.error("Error fetching room:", error);
    throw error.response?.data || error;
  }
}

// kiểm tra trước khi cập nhật phòng
export async function checkBeforeUpdateRoomAPI(id: number) {
  try {
    const response = await axiosInstance.get(
      `/api/admin/rooms/${id}/check_before_upd`
    );

    return response.data;
  } catch (error: any) {
    console.error("Error fetching room:", error);
    throw error.response?.data || error;
  }
}

// cập nhật phòng
export async function updateRoomAPI(data: {
  room_id: string | number;
  name: string;
  width: string | number;
  height: string | number;
  capacity: number;
  aside_gap: [];
  type: number;
}) {
  try {
    const response = await axiosInstance.put(
      `/api/admin/rooms/${data.room_id}`,
      {
        ...data,
      }
    );

    return response.data;
  } catch (error: any) {
    console.error("Error fetching room:", error);
    throw error.response?.data || error;
  }
}
