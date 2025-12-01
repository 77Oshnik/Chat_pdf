import { create } from 'zustand';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  context?: Array<{
    pageNumber: number;
    content: string;
    score: number;
  }>;
}

interface ChatState {
  messages: Message[];
  sessionId: string | null;
  isLoading: boolean;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  setSessionId: (sessionId: string) => void;
  setIsLoading: (isLoading: boolean) => void;
  clearChat: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  sessionId: null,
  isLoading: false,
  setMessages: (messages) => set({ messages }),
  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
  setSessionId: (sessionId) => set({ sessionId }),
  setIsLoading: (isLoading) => set({ isLoading }),
  clearChat: () => set({ messages: [], sessionId: null }),
}));
