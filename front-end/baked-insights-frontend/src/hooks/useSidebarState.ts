import { create } from 'zustand';

interface SidebarState {
    isVisible: boolean;
    toggle: () => void;
}

export const useSidebarState = create<SidebarState>((set) => ({
    isVisible: true,
    toggle: () => set((state) => ({ isVisible: !state.isVisible })),
}));