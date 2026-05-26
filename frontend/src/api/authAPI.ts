import instance from "./axiosInstance";
import type { LoginRequest, RegisterRequest, ResetPasswordRequest, SendOtpRequest, VerifyOtpRequest } from "../types";

export const login = async (data: LoginRequest) => {
  const response = await instance.post("/auth/login", data);
  return response.data;
};

export const register = async (data: RegisterRequest) => {
  const response = await instance.post("/auth/register", data);
  return response.data;
};

export const logout = async () => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    await instance.post(
      "/auth/logout",
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
  }
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  // Xóa phiên chat AI khi đăng xuất
  localStorage.removeItem("ai_session_id");
  localStorage.removeItem("ai_chat_messages");
};

export const refreshToken = async (refreshToken: string) => {
  const response = await instance.post("/auth/refresh-token", { refreshToken });
  return response.data;
};

export const sendOtp = async (data: SendOtpRequest) => {
  const response = await instance.post("/auth/send-otp", data);
  return response.data;
};

export const verifyOtp = async (data: VerifyOtpRequest): Promise<{ valid: boolean; message: string }> => {
  const response = await instance.post("/auth/verify-otp", data);
  return response.data;
};

export const resetPassword = async (data: ResetPasswordRequest) => {
  const response = await instance.post("/auth/reset-password", data);
  return response.data;
};
