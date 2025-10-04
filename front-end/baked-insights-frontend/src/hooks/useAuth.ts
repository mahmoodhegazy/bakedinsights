import { create } from 'zustand';

interface AuthState {
    getToken: () => string | null;
    setAuth: (token: string) => void;
    logout: () => void;
}

export const useAuth = create<AuthState>((set) => ({
    getToken : () => {
        const token = localStorage.getItem('token');
        if (token) {
            return token;
        }
        return null;
    },
    setAuth: (token) => {
        localStorage.setItem('token', token);
    },
    logout: () => {
        localStorage.removeItem('token');
    },
}));