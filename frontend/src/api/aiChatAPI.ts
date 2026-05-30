import axios from "axios";
import instance from "./axiosInstance";
import type {
  AiChatRequest,
  AiChatResponse,
  AiMessageResponse,
} from "../types";

export const sendAiMessage = async (
  request: AiChatRequest,
): Promise<AiChatResponse> => {
  const res = await instance.post<AiChatResponse>("/ai/chat", request);
  return res.data;
};

export const deleteAiConversation = async (
  sessionId: string,
): Promise<void> => {
  await instance.delete(`/ai/conversations/${sessionId}`);
};

export const getAiMessages = async (
  sessionId: string,
): Promise<AiMessageResponse[]> => {
  try {
    const res = await instance.get<AiMessageResponse[]>(
      `/ai/conversations/${sessionId}/messages`,
    );

    return res.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      localStorage.removeItem("ai_session_id");
      return [];
    }

    throw error;
  }
};
