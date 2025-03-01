import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TableService } from '../services/tableService';
import { APITableColumnUpdates, APITableDataUpdates } from '../types/index';
import { toast } from 'react-toastify';

export const useTableShares = (table_id: number) => {
    // Get access to the React Query client for cache management
    const queryClient = useQueryClient();

    const { 
        data: tableShares,
        isLoading: isLoadingTableShares 
    } = useQuery({
        queryKey: [`tableShares-${table_id}`],
        queryFn: () => TableService.getTableShares(table_id),
    });

    const updateTableSharesMutation = useMutation({
        mutationFn: (updates : number[]) => TableService.updateTableShares(table_id, updates),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [`tableShares-${table_id}`] });
            toast.success("Succesfully updated table shares.");
        },
        onError: (error: Error) => {
            toast.error(`${error}`);
        },
    });

   // Return all the necessary data and functions for components to use
    return {
        // Queries
        tableShares,
        isLoadingTableShares,

        // Mutations
        updateTableShares: updateTableSharesMutation.mutate,
    };
};

export const useTableDetails = (table_id: number) => {

    // Get access to the React Query client for cache management
    const queryClient = useQueryClient();

    const { 
        data: tableDetails,
        isLoading:isLoadingTableDetails 
    } = useQuery({
        queryKey: [`tableDetailsData-${table_id}`],
        queryFn: () => TableService.getTable(table_id),
    });

    const createTableTabMutation = useMutation({
        mutationFn: () => TableService.createTableTab(table_id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [`tableDetailsData-${table_id}`] });
            toast.success("Succesfully created tab.");
        },
        onError: (error: Error) => {
            toast.error(`${error}`);
        },
    });

    const updateTableTabMutation = useMutation({
        mutationFn: ({tab_id , name} : {tab_id: number, name: string}) => TableService.updateTableTab(tab_id, name),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [`tableDetailsData-${table_id}`] });
            toast.success("Succesfully updated tab.");
        },
        onError: (error: Error) => {
            toast.error(`${error}`);
        },
    });

    const updateTableMutation = useMutation({
        mutationFn: (name: string) => TableService.updateTable(table_id, name),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [`tableDetailsData-${table_id}`] });
            toast.success("Succesfully updated table.");
        },
        onError: (error: Error) => {
            toast.error(`${error}`);
        },
    });

    const deleteTableTabMutation = useMutation({
        mutationFn: (tab_id: number) => TableService.deleteTableTab(tab_id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [`tableDetailsData-${table_id}`] });
            toast.success("Succesfully updated table.");
        },
        onError: (error: Error) => {
            toast.error(`${error}`);
        },
    });

    const updateTableDataMutation = useMutation({
        mutationFn: (updates: APITableDataUpdates) => TableService.updateTableData(updates),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [`tableDetailsData-${table_id}`] });
            toast.success("Succesfully updated table.");
        },
        onError: (error: Error) => {
            toast.error(`${error}`);
        },
    });

    const deleteTableDataMutation = useMutation({
        mutationFn: (record_id: number) => TableService.deleteTableData(record_id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [`tableDetailsData-${table_id}`] });
            toast.success("Succesfully updated table.");
        },
        onError: (error: Error) => {
            toast.error(`${error}`);
        },
    });

    const updateTableColumnMutation = useMutation({
        mutationFn: (updateData: APITableColumnUpdates) => TableService.updateTableColumn(updateData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [`tableDetailsData-${table_id}`] });
            toast.success("Succesfully updated table.");
        },
        onError: (error: Error) => {
            toast.error(`${error}`);
        },
    });

    const deleteTableColumnMutation = useMutation({
        mutationFn: (columnID: number) => TableService.deleteTableColumn(columnID),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [`tableDetailsData-${table_id}`] });
            toast.success("Succesfully deleted field.");
        },
        onError: (error: Error) => {
            toast.error(`${error}`);
        },
    });

   // Return all the necessary data and functions for components to use
    return {
        // Queries
        tableDetails,
        isLoadingTableDetails,

        // Mutations
        updateTable: updateTableMutation.mutate,
        updateTableData: updateTableDataMutation.mutate,
        deleteTableData: deleteTableDataMutation.mutate,
        updateTableColumn: updateTableColumnMutation.mutate,
        deleteTableColumn: deleteTableColumnMutation.mutate,
        createTableTab: createTableTabMutation.mutate,
        updateTableTab: updateTableTabMutation.mutate,
        deleteTableTab: deleteTableTabMutation.mutate,
    };

};


export const useTablesManager = () => {
    // Get access to the React Query client for cache management
    const queryClient = useQueryClient();

    // Query hook to fetch the list of users
    const { 
        data: assignedTables,
        isLoading: isLoadingAssignedTables 
    } = useQuery({
        queryKey: ['assignedTablesData'],
        queryFn: TableService.getAssignedTables,
    });

    const createTableMutation = useMutation({
        mutationFn: (name: string) => TableService.createTable(name),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['assignedTablesData'] });
            toast.success("Succesfully created table.");
        },
        onError: (error: Error) => {
            toast.error(`${error}`);
        },
    });

    const deleteTableMutation = useMutation({
        mutationFn: (id: number) => TableService.deleteTable(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['assignedTablesData'] });
            toast.success("Succesfully deleted table.");
        },
        onError: (error: Error) => {
            toast.error(`${error}`);
        },
    });


   // Return all the necessary data and functions for components to use
    return {
        // Queries
        assignedTables,
        isLoadingAssignedTables,

        // Mutations
        createTable: createTableMutation.mutate,
        deleteTable: deleteTableMutation.mutate,

    };
};

export const useTableSelectData = () => {

    const { 
        data: tableSelectData,
        isLoading: isLoadingTableSelectData, 
    } = useQuery({
        queryKey: ["tableSelectData"],
        queryFn: () => TableService.getTableSelectData(),
    });

    return {
        tableSelectData,
        isLoadingTableSelectData,
    };

};