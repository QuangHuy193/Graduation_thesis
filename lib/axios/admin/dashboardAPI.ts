import axiosInstance from "../config";

export const getAdminDashboardStats = () => {
    return axiosInstance.get(
        "/api/admin/dashboard/today"
    );
};
export const getAdminDashboardWarnings = () => {
    return axiosInstance.get(
        "/api/admin/dashboard/warning"
    );
}