import api from '../api';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  context?: Array<{
    pageNumber: number;
    content: string;
    score: number;
  }>;
}

export interface SendMessageData {
  message: string;
  sessionId?: string;
}

export interface ChatResponse {
  success: boolean;
  data: {
    answer: string;
    context: Array<{
      pageNumber: number;
      content: string;
      score: number;
    }>;
    sessionId: string;
    cached: boolean;
  };
}

export const chatService = {
  sendMessage: async (pdfId: string, data: SendMessageData): Promise<ChatResponse> => {
    const response = await api.post(`/chat/${pdfId}`, data);
    return response.data;
  },

  getHistory: async (limit: number = 20) => {
    const response = await api.get('/chat/history', { params: { limit } });
    return response.data;
  },

  getSession: async (sessionId: string) => {
    const response = await api.get(`/chat/session/${sessionId}`);
    return response.data;
  },

  deleteSession: async (sessionId: string) => {
    const response = await api.delete(`/chat/session/${sessionId}`);
    return response.data;
  },

  getPDFSessions: async (pdfId: string) => {
    const response = await api.get(`/chat/pdf/${pdfId}`);
    return response.data;
  },
};
