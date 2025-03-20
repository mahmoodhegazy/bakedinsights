import api from '../api/axios';
import { User } from '../types/index';

export class UserService {

    // Get all Users
    static async getUsers() {
        const response = await api.get<{ users: User[] }>('/users/');
        try {
            return response.data.users;
        } catch(e: any) {
            return Promise.reject(new Error(`${e.message}`));
        }
    }

    static async getCurrentUser() {
        const response = await api.get<{ user: User }>('/users/current');
        try {
            return response.data.user;
        } catch(e: any) {
            return Promise.reject(new Error(`${e.message}`));
        }
    }

    static async createUser(data: User) {
        try {
            const response = await api.post('/users/', data);
            return response.data;
        } catch(e: any) {
            return Promise.reject(new Error(`${e.message}`));
        }
    }

    static async updateUser(data: User) {
        try {
            const response = await api.put(`/users/${data.id}`, data);
            return response.data;
        } catch (e:any) {
            return Promise.reject(new Error(`${e.message}`));
        }
    }

    static async deleteUser(id: number) {
        try {
            await api.delete(`/users/${id}`);
        } catch (e: any) {
            return Promise.reject(new Error(`${e.message}`));
        }
    }
};