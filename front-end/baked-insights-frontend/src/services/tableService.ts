import api from '../api/axios';
import { User, APITableColumnUpdates, APITableDataUpdates, APITableShare, APITable, _APITableDataUpdates } from '../types/index';
import { useDataRefreshStore } from '../hooks/useDataRefreshStore';

export class TableService {

    static async getAssignedTables() {
        const response = await api.get<{ tables: APITable[] }>(`/tables/assigned`);
        try {
            return response.data.tables;
        } catch(e: any) {
            return Promise.reject(new Error(`${e.message}`));
        }
    }

    static async getTable(id: number) {
        const response = await api.get<{ table: APITable }>(`/tables/${id}`);
        try {
            return response.data.table;
        } catch(e: any) {
            return Promise.reject(new Error(`${e.message}`));
        }
    }

    static async getTableShares(id: number) {
        const response = await api.get<{ shares: APITableShare[] }>(`/tables/${id}/shares`);
        try {
            return response.data.shares;
        } catch(e: any) {
            return Promise.reject(new Error(`${e.message}`));
        }
    }

    static async updateTable(id: number, name: string) {
        try {
            const response = await api.put(`/tables/${id}`, {name: name});
            // Trigger refresh event
            useDataRefreshStore.getState().triggerRefresh('table-data-updated');
            return response.data;
        } catch (e:any) {
            return Promise.reject(new Error(`${e.message}`));
        }
    }

    static async deleteTableTab(id: number) {
        try {
            await api.delete(`/tables/tabs/${id}`);
            // Trigger refresh event
            useDataRefreshStore.getState().triggerRefresh('table-data-updated');
        } catch(e: any) {
            return Promise.reject(new Error(`${e.message}`));
        }
    }

    static async deleteTableColumn(id: number) {
        try {
            await api.delete(`/tables/columns/${id}`);
            // Trigger refresh event
            useDataRefreshStore.getState().triggerRefresh('table-data-updated');
        } catch(e: any) {
            return Promise.reject(new Error(`${e.message}`));
        }
    }

    static async updateTableColumn(updateData: APITableColumnUpdates) { 
        try {
            const response = await api.put(`/tables/columns`, updateData);
            // Trigger refresh event
            useDataRefreshStore.getState().triggerRefresh('table-data-updated');
            return response.data;
        } catch (e:any) {
            return Promise.reject(new Error(`${e.message}`));
        }
    }

    static async updateTableShares(id: number, updates: number[]) { 
        try {
            const response = await api.put(`/tables/${id}/shares`, {user_ids: updates});
            return response.data;
        } catch (e:any) {
            return Promise.reject(new Error(`${e.message}`));
        }
    }

    static async updateTableData(updates: APITableDataUpdates) { 
        try {
            let formData = new FormData();
            for ( let key in updates ) {
                if (key == "updates") {
                    for (var i = 0; i < updates[key].length; i++) {
                        for ( let updateKey in updates[key][i] ) {
                            formData.append(`updates[${i}][${updateKey}]`, updates[key][i][updateKey as keyof _APITableDataUpdates]);
                        }
                    }
                } else {
                    formData.append(key, updates[key as keyof APITableDataUpdates] as any);
                }
            }
            const response = await api.post(`/tables/tabs/${updates.tab_id}/data`, formData, {
                headers: {
                    'Content-Type': 'multipart/formdata',
                }
            });
            
            // Check if update contains SKU or Lot Number
            const containsSKU = updates.updates.some(update => {
                // TODO: How do we check if this is a SKU update?
                return update.column_id && typeof update.value === 'string' && update.value.trim() !== '';
            });
            
            const containsLotNumber = updates.updates.some(update => {
                // Similarly, how do we check if this is a lot number update?
                return update.column_id && typeof update.value === 'string' && update.value.trim() !== '';
            });
            
            // Trigger appropriate refresh events
            useDataRefreshStore.getState().triggerRefresh('table-data-updated');
            
            if (containsSKU) {
                useDataRefreshStore.getState().triggerRefresh('sku-created');
            }
            
            if (containsLotNumber) {
                useDataRefreshStore.getState().triggerRefresh('lot-number-created');
            }
            
            return response.data;
        } catch (e:any) {
            return Promise.reject(new Error(`${e.message}`));
        }
    }

    static async deleteTableData(record_id: number) { 
        try {
            const response = await api.delete(`/tables/records/${record_id}`);
            // Trigger refresh event
            useDataRefreshStore.getState().triggerRefresh('table-data-updated');
            return response.data;
        } catch (e:any) {
            return Promise.reject(new Error(`${e.message}`));
        }
    }

    static async updateTableTab(tab_id: number, name: string) { 
        try {
            const response = await api.put(`/tables/tabs/${tab_id}`, name);
            // Trigger refresh event
            useDataRefreshStore.getState().triggerRefresh('table-data-updated');
            return response.data;
        } catch (e:any) {
            return Promise.reject(new Error(`${e.message}`));
        }
    }

    static async createTableTab(table_id: number) {
        const apiData = {
            name: "New Tab",
            columns: [
                {
                    "name": "New column",
                    "data_type": "text"
                }
            ],
        }
        try {
            const response = await api.post(`/tables/${table_id}/tabs`, apiData);
            // Trigger refresh event
            useDataRefreshStore.getState().triggerRefresh('table-data-updated');
            return response.data;
        } catch(e: any) {
            return Promise.reject(new Error(`${e.message}`));
        }
    }

    static async createTable(name: string) {
        const apiData = {
            name: name,
            tabs: [{
                name: "Tab 1",
                columns: [
                    {
                        "name": "New column",
                        "data_type": "text"
                    }
                ]}],
        }
        try {
            const response = await api.post('/tables/', apiData);
            // Trigger refresh event
            useDataRefreshStore.getState().triggerRefresh('table-created');
            return response.data;
        } catch(e: any) {
            return Promise.reject(new Error(`${e.message}`));
        }
    }

    static async createTablefromData(name: string, columns: any[], data: any[][]) {
        const apiData = {
            name: name,
            tabs: [{
                name: "Tab 1",
                columns: columns,
                data: data,
            }],
        }
        try {
            const response = await api.post('/tables/', apiData);
            // Trigger refresh event
            useDataRefreshStore.getState().triggerRefresh('table-created');
            return response.data;
        } catch(e: any) {
            return Promise.reject(new Error(`${e.message}`));
        }
    }

    static async deleteTable(id: number) {
        try {
            await api.delete(`/tables/${id}`);
            // Trigger refresh event
            useDataRefreshStore.getState().triggerRefresh('table-data-updated');
        } catch(e: any) {
            return Promise.reject(new Error(`${e.message}`));
        }
    }

    static async getTableSelectData() {
        try {
            const users = (await api.get<{ users: User[] }>('/users/')).data.users.map(
                (user) => ({
                    value: user.username,
                    id: user.id
                })
            );
            const roles = (await api.get<{ roles: string[] }>('/users/roles')).data.roles.map((r, i) => (
                {
                    value: r,
                    id: i,
                }
            ));
            return {
                user: users,
                role: roles,
            };
        } catch(e: any) {
            return Promise.reject(new Error(`${e.message}`));
        }
    }
};