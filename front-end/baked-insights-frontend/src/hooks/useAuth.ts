import { create } from 'zustand';
import { User } from '../types';

interface AuthState {
    user: User | null;
    token: string | null;
    setAuth: (user: User, token: string) => void;
    logout: () => void;
}

export const useAuth = create<AuthState>((set) => ({
    user: null,
    token: null,
    setAuth: (user, token) => {
        set({ user, token });
    },
    logout: () => {
        set({ user: null, token: null });
    },
}));