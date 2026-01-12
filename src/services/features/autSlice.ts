import axiosInstance from "@/services/constant/axiosInstance";

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  token: string;
  role?: string;
}

export const loginAdmin = async (credentials: LoginRequest): Promise<LoginResponse> => {
  try {
    const response = await axiosInstance.post<LoginResponse>(
      "login",
      credentials
    );
    return response.data;
  } catch (error: any) {
    throw error.response?.data || { message: "Login failed", token: "" };
  }
  
};
