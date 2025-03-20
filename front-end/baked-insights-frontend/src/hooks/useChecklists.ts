import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChecklistService } from '../services/checklistService';
import { ChecklistTemplateService } from '../services/checklistTemplateService';
import { toast } from 'react-toastify';
import { APIChecklistItem, APIChecklistTemplate } from '../types';


export const useTemplateShares = (template_id: number) => {
    // Get access to the React Query client for cache management
    const queryClient = useQueryClient();

    const { 
        data: templateShares,
        isLoading: isLoadingTemplateShares 
    } = useQuery({
        queryKey: [`templateShares-${template_id}`],
        queryFn: () => ChecklistTemplateService.getTemplateShares(template_id),
    });

    const updateTemplateSharesMutation = useMutation({
        mutationFn: (updates : number[]) => ChecklistTemplateService.updateTemplateShares(template_id, updates),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [`templateShares-${template_id}`] });
            toast.success("Succesfully updated template shares.");
        },
    });

   // Return all the necessary data and functions for components to use
    return {
        // Queries
        templateShares,
        isLoadingTemplateShares,

        // Mutations
        updateTemplateShares: updateTemplateSharesMutation.mutate,
    };
};


export const useChecklistTemplateDetails = (template_id: number) => {

    // Get access to the React Query client for cache management
    const queryClient = useQueryClient();

    // Query hook to fetch the list of assigned checklists
    const { 
        data: checklistTemplateDetails,
        isLoading: isLoadingChecklistTemplateDetails,
    } = useQuery({
        queryKey: [`checklistTemplate-${template_id}`],
        queryFn: () => ChecklistTemplateService.getTemplate(template_id),
    });

    const updateChecklistTemplateMutation = useMutation({
        mutationFn: (data: APIChecklistTemplate) => ChecklistTemplateService.updateTemplate(template_id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [`checklistTemplate-${template_id}`] });
            toast.success("Succesfully updated template.");
        },
    });

    const deleteFieldMutation = useMutation({
        mutationFn: (field_id: number) => ChecklistTemplateService.deleteField(field_id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [`checklistTemplate-${template_id}`] });
            toast.success("Succesfully updated template.");
        },
    });

    // Return all the necessary data and functions for components to use
    return {
        // Queries
        checklistTemplateDetails,
        isLoadingChecklistTemplateDetails,

        // Mutations
        updateChecklistTemplate: updateChecklistTemplateMutation.mutate,
        deleteField: deleteFieldMutation.mutate,
    };

};

export const useChecklistTemplates = () => {

    // Get access to the React Query client for cache management
    const queryClient = useQueryClient();

    // Query hook to fetch the list of assigned checklists
    const { 
        data: checklistTemplates,
        isLoading: isLoadingChecklistTemplates,
    } = useQuery({
        queryKey: ['checklistTemplates'],
        queryFn: ChecklistTemplateService.getAllTemplates,
    });

    const createChecklistTemplateMutation = useMutation({
        mutationFn: (data: { title: string, description: string }) => ChecklistTemplateService.createTemplate(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['checklistTemplates'] });
            toast.success("Succesfully created template.");
        },
    });

    const deleteChecklistTemplateMutation = useMutation({
        mutationFn: (id : number) => ChecklistTemplateService.deleteTemplate(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['checklistTemplates'] });
            queryClient.invalidateQueries({ queryKey: ['checklists'] });
            toast.success("Succesfully deleted template.");
        },
    });


    // Return all the necessary data and functions for components to use
    return {
        // Queries
        checklistTemplates,
        isLoadingChecklistTemplates,

        // Mutations
        createChecklistTemplate: createChecklistTemplateMutation.mutate,
        deleteChecklistTemplate: deleteChecklistTemplateMutation.mutate,
    };

};

export const useChecklists = () => {

    // Get access to the React Query client for cache management
    const queryClient = useQueryClient();

    // Query hook to fetch the list of assigned checklists
    const { 
        data: checklists,
        isLoading: isLoadingChecklists 
    } = useQuery({
        queryKey: ['checklists'],
        queryFn: ChecklistService.getUserChecklists,
    });

    const createChecklistMutation = useMutation({
        mutationFn: (template_id: number) => ChecklistService.createChecklist(template_id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['checklists'] });
            toast.success("Succesfully created checklist.");
        },
    });

    const deleteChecklistMutation = useMutation({
        mutationFn: (id : number) => ChecklistService.deleteChecklist(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [`checklists`] });
            toast.success("Succesfully deleted checklist.");
        },
    });


    // Return all the necessary data and functions for components to use
    return {
        // Queries
        checklists,
        isLoadingChecklists,

        // Mutations
        createChecklist: createChecklistMutation.mutate,
        deleteChecklist: deleteChecklistMutation.mutate,
    };
};


export const useChecklistDetails = (checklist_id: number) => {

    // Get access to the React Query client for cache management
    const queryClient = useQueryClient();

    // Query hook to fetch the list of assigned checklists
    const { 
        data: checklistDetails,
        isLoading: isLoadingChecklistDetails
    } = useQuery({
        queryKey: [`checklists-${checklist_id}`],
        queryFn: () => ChecklistService.getChecklistDetails(checklist_id),
    });

    const updateChecklistItemMutation = useMutation({
        mutationFn: (data: APIChecklistItem) => ChecklistService.updateItem(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [`checklists-${checklist_id}`] });
            queryClient.invalidateQueries({ queryKey: ['checklists'] });
            toast.success("Succesfully updated checklist.");
        },
    });

    const submitChecklistMutation = useMutation({
        mutationFn: () => ChecklistService.submitChecklist(checklist_id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [`checklists-${checklist_id}`] });
            queryClient.invalidateQueries({ queryKey: ['checklists'] });
            toast.success("Succesfully submitted checklist.");
        },
    });


    // Return all the necessary data and functions for components to use
    return {
        // Queries
        checklistDetails,
        isLoadingChecklistDetails,

        // Mutations
        updateChecklistItem: updateChecklistItemMutation.mutate,
        submitChecklist: submitChecklistMutation.mutate,
    };

}