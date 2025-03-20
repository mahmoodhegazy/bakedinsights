import api from '../api/axios';
import { APIChecklist, APIChecklistItem } from '../types/checklist';
import { useDataRefreshStore } from '../hooks/useDataRefreshStore';

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
            // Trigger refresh event
            useDataRefreshStore.getState().triggerRefresh('checklist-created');
            return response.data;
        } catch(e: any) {
            return Promise.reject(new Error(`${e.message}`));
        }
    }

    // Delete template
    static async deleteChecklist(checklist_id: number) {
        try {
            await api.delete(`/checklists/${checklist_id}`);
            // Trigger refresh event
            useDataRefreshStore.getState().triggerRefresh('checklist-created');
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
            let formData = new FormData();
            for ( let key in apiData) {
                formData.append(key, apiData[key as keyof APIChecklistItem] as any);
            }
            const response = await api.post(`/checklists/items`, formData, {
                headers: {
                    'Content-Type': 'multipart/formdata',
                }
            });
            
            // Check if this is a SKU or lot number update
            if (apiData.value) {
                useDataRefreshStore.getState().triggerRefresh('sku-created');
                useDataRefreshStore.getState().triggerRefresh('lot-number-created');
            }
            
            // Trigger general checklist update event
            useDataRefreshStore.getState().triggerRefresh('checklist-created');
            return response.data;
        } catch(e: any) {
            return Promise.reject(new Error(`${e.message}`));
        }
    }

    // Update checklist item
    static async submitChecklist(checklist_id: number) {
        try {
            const response = await api.put(`/checklists/${checklist_id}/submit`);
            // Trigger refresh event
            useDataRefreshStore.getState().triggerRefresh('checklist-submitted');
            return response.data;
        } catch(e: any) {
            return Promise.reject(new Error(`${e.message}`));
        }
    }
}