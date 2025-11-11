export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  token?: string;
  error?: string;
}
