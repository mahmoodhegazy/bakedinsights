import axios from 'axios';
import { useAuth } from '../hooks/useAuth';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:5050/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use((config) => {
    const token = useAuth.getState().token;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            useAuth.getState().logout();
        }
        console.log(error);
        return Promise.reject(error);
    }
);

export default api;
