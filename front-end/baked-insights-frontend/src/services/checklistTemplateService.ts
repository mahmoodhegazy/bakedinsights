import api from '../api/axios';
import { APITemplateShare, APIChecklistTemplate } from '../types/checklist';

export class ChecklistTemplateService {

    // Create a new checklist template
    static async createTemplate(data: {
        title: string;
        description: string;
    }) {
        try {
            const response = await api.post('/checklists/templates', data);
            return response.data;
        } catch(e: any) {
            return Promise.reject(new Error(`${e.message}`));
        }
    }

    // Update template data
    static async updateTemplate(templateID: number, apiData: APIChecklistTemplate) {
        try {
            const response = await api.put<APIChecklistTemplate>(`/checklists/templates/${templateID}`, apiData);
            return response.data;
        } catch(e: any) {
            return Promise.reject(new Error(`${e.message}`));
        }
    }

    // Delete template
    static async deleteTemplate(templateID: number) {
        try {
            await api.delete(`/checklists/templates/${templateID}`);
        } catch(e: any) {
            return Promise.reject(new Error(`${e.message}`));
        }
    }

    // Delete template field
    static async deleteField(fieldID: number) {
        try {
            await api.delete(`/checklists/templates/fields/${fieldID}`);
        } catch(e: any) {
            return Promise.reject(new Error(`${e.message}`));
        }
    }

    // Get all templates
    static async getAllTemplates() {
        try {
            const response = await api.get<APIChecklistTemplate[]>(`/checklists/templates`);
            return response.data;
        } catch(e: any) {
            return Promise.reject(new Error(`${e.message}`));
        }
    }

    // Get template data
    static async getTemplate(templateId: number) {
        try {
            const response = await api.get<APIChecklistTemplate>(`/checklists/templates/${templateId}`);
            return response.data;
        } catch(e: any) {
            return Promise.reject(new Error(`${e.message}`));
        }
    }

    // Get template shares
    static async getTemplateShares(template_id: number) {
        const response = await api.get<{ shares: APITemplateShare[] }>(`/checklists/templates/${template_id}/shares`);
        try {
            return response.data.shares;
        } catch(e: any) {
            return Promise.reject(new Error(`${e.message}`));
        }
    }

    // Update tempalte shares
    static async updateTemplateShares(template_id: number, updates: number[]) { 
        try {
            const response = await api.put(`/checklists/templates/${template_id}/shares`, {user_ids: updates});
            return response.data;
        } catch (e:any) {
            return Promise.reject(new Error(`${e.message}`));
        }
    }


}