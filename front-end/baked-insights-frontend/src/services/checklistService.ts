import api from '../api/axios';
import {  APIChecklist, APIChecklistItem } from '../types/checklist';

export class ChecklistService {

    // Get all templates
    static async getUserChecklists() {
        try {
            const response = await api.get<APIChecklist[]>(`/checklists/`);
            return response.data;
        } catch(e: any) {
            return Promise.reject(new Error(`${e.message}`));
        }
    }

    // Create a new checklist
    static async createChecklist(template_id: number) {
        try {
            const response = await api.post(`/checklists/${template_id}`);
            return response.data;
        } catch(e: any) {
            return Promise.reject(new Error(`${e.message}`));
        }
    }

    // Delete template
    static async deleteChecklist(checklist_id: number) {
        try {
            await api.delete(`/checklists/${checklist_id}`);
        } catch(e: any) {
            return Promise.reject(new Error(`${e.message}`));
        }
    }

    // Get checklist details
    static async getChecklistDetails(checklist_id: number) {
        try {
            const response = await api.get<APIChecklistItem[]>(`/checklists/${checklist_id}`);
            return response.data;
        } catch(e: any) {
            return Promise.reject(new Error(`${e.message}`));
        }
    }

    // Update checklist item
    static async updateItem(apiData: APIChecklistItem) {
        try {
            const response = await api.put<APIChecklistItem>(`/checklists/items`, apiData);
            return response.data;
        } catch(e: any) {
            return Promise.reject(new Error(`${e.message}`));
        }
    }

    // Update checklist item
    static async submitChecklist(checklist_id: number) {
        try {
            const response = await api.put(`/checklists/${checklist_id}/submit`);
            return response.data;
        } catch(e: any) {
            return Promise.reject(new Error(`${e.message}`));
        }
    }

}