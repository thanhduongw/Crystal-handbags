import instance from "./axiosInstance";
import type { LoginRequest, RegisterRequest, ResetPasswordRequest, SendOtpRequest, VerifyOtpRequest } from "../types";

const OTP_CLIENT_COOLDOWN_MS = 60_000;
const OTP_RATE_LIMIT_PREFIX = "otp:last-sent:";

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const getOtpRateLimitKey = (data: SendOtpRequest) =>
  `${OTP_RATE_LIMIT_PREFIX}${data.purpose}:${normalizeEmail(data.email)}`;

const createOtpRateLimitError = (remainingSeconds: number) => ({
  response: {
    data: {
      message: `Vui lòng chờ ${remainingSeconds}s trước khi gửi lại OTP.`,
    },
  },
});

const assertOtpSendAllowed = (data: SendOtpRequest) => {
  const key = getOtpRateLimitKey(data);
  const lastSentAt = Number(localStorage.getItem(key) ?? 0);
  const elapsed = Date.now() - lastSentAt;

  if (lastSentAt > 0 && elapsed < OTP_CLIENT_COOLDOWN_MS) {
    const remainingSeconds = Math.ceil((OTP_CLIENT_COOLDOWN_MS - elapsed) / 1000);
    throw createOtpRateLimitError(remainingSeconds);
  }

  localStorage.setItem(key, String(Date.now()));
};

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
  assertOtpSendAllowed(data);

  try {
    const response = await instance.post("/auth/send-otp", data);
    return response.data;
  } catch (error) {
    localStorage.removeItem(getOtpRateLimitKey(data));
    throw error;
  }
};

export const verifyOtp = async (data: VerifyOtpRequest): Promise<{ valid: boolean; message: string }> => {
  const response = await instance.post("/auth/verify-otp", data);
  return response.data;
};

export const resetPassword = async (data: ResetPasswordRequest) => {
  const response = await instance.post("/auth/reset-password", data);
  return response.data;
};
