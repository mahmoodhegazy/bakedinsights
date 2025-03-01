import { create } from 'zustand';

interface ChatState {
  isVisible: boolean;
  toggle: () => void;
  close: () => void;
}

export const useChatState = create<ChatState>((set) => ({
  isVisible: false,
  toggle: () => set((state) => ({ isVisible: !state.isVisible })),
  close: () => set({ isVisible: false }),
}));