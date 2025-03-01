import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserService } from '../services/userService';
import { User } from '../types/index';
import { toast } from 'react-toastify';


export const useUsers = () => {
    // Get access to the React Query client for cache management
    const queryClient = useQueryClient();

    // Query hook to fetch the list of users
    const { 
        data: allUsers,
        isLoading: isLoadingUsers
    } = useQuery({
        queryKey: ['allUsersData'],
        queryFn: UserService.getUsers,
    });

    const { 
        data: currentUser,
        isLoading: isLoadingCurrentUser
    } = useQuery({
        queryKey: ['currentUserData'],
        queryFn: UserService.getCurrentUser,
    });

    const createUserMutation = useMutation({
        mutationFn: (data: User) => UserService.createUser(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['allUsersData'] });
            toast.success("Succesfully created user.");
        },
        onError: (error: Error) => {
            toast.error(`${error}`);
        },
    });

    const updateUserMutation = useMutation({
        mutationFn: (data: User) => UserService.updateUser(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['allUsersData'] });
            queryClient.invalidateQueries({ queryKey: ['currentUserData'] });
            toast.success("Succesfully updated user.");
        },
        onError: (error: Error) => {
            toast.error(`${error}`);
        },
    });

    const deleteUserMutation = useMutation({
        mutationFn: (id: number) => UserService.deleteUser(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['allUsersData'] });
            toast.success("Succesfully delete user.");
        },
        onError: (error: Error) => {
            toast.error(`${error}`);
        },
    });

    // Return all the necessary data and functions for components to use
    return {
        // Queries
        allUsers,
        isLoadingUsers,
        // --
        currentUser,
        isLoadingCurrentUser,

        // Mutations
        createUser: createUserMutation.mutate,
        updateUser: updateUserMutation.mutate,
        deleteUser: deleteUserMutation.mutate,
    };
};