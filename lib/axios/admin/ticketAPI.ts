import axiosInstance from "../config";

export async function scanQRTicketAPI(ticket_id: number | string) {
  try {
    const res = await axiosInstance.put(`/api/admin/ticket/scan/${ticket_id}`);
    return res.data.data;
  } catch (err: any) {
    console.error("scanQRTicketAPI error:", err);
    throw err;
  }
}
