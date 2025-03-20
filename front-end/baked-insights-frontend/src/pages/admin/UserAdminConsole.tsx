import { useEffect, useState } from 'react';
import { Table } from '../../components/Table/Table';
import { useUsers } from '../../hooks/useUsers';
import { convertUsersToTableData, convertTableRowToUser } from '../../utils/userUtils';
import { useTableSelectData } from '../../hooks/useTables';
import type { TableData } from '../../types/index';

export const UserAdminConsole: React.FC = () => {

    const [data, setData] = useState<TableData>({
        headers: [],
        dataEntries: [[]],
    });

    const { 
        tableSelectData,
        isLoadingTableSelectData,
    } = useTableSelectData();

    const { 
        // Queries
        allUsers,
        isLoadingUsers,
        currentUser,
        isLoadingCurrentUser,

        // Mutations
        createUser,
        updateUser,
        deleteUser,
    } = useUsers();

    useEffect(() => {
        if (!isLoadingUsers && allUsers && !isLoadingTableSelectData && tableSelectData) {
            allUsers.sort((a, b) => a.id - b.id);
            const usersTableData = convertUsersToTableData(allUsers, tableSelectData);
            setData(usersTableData);
        }
    }, [tableSelectData, isLoadingTableSelectData, allUsers, isLoadingUsers]);

    const updateRow = (
        rowIndex: number,
        data: TableData,
        successCallback: (data: any, variables: any, context: unknown) => void,
        errorCallback: (data: any, variables: any, context: unknown) => void,
    ) => {
        const userID = data.dataEntries[rowIndex][0].rowIndex;
        const user = convertTableRowToUser(rowIndex, data);
        if (userID < 0) {
            createUser(user, {
                onSuccess: successCallback,
                onError: errorCallback,
            });
        } else {
            updateUser(user, {
                onSuccess: successCallback,
                onError: errorCallback,
            });
        }
    };

    const deleteRow = (
        rowIndex: number,
        data: TableData,
        successCallback: (data: any, variables: any, context: unknown) => void,
        errorCallback: (data: any, variables: any, context: unknown) => void,
    ) => {
        const user = convertTableRowToUser(rowIndex, data);
        deleteUser(user.id, {
            onSuccess: successCallback,
            onError: errorCallback,
        });
    };

    return (
        <>
        <div className="mb-4 font-bold text-slate-500 flex-col">
            <h1>User Admin Console</h1>
        </div>
        {
            (isLoadingUsers || isLoadingCurrentUser)
                ? (
                    <div className="flex grow justify-center items-center p-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
                    </div>
            ) : (!isLoadingCurrentUser && currentUser && !currentUser.is_super_admin_role) 
                ? <div className="max-w-4xl mx-auto py-8 px-4">
                    <div className="text-center py-12">
                        <h3 className="text-lg font-medium text-gray-900">
                            No Results
                        </h3>
                        <p className="mt-2 text-sm text-gray-500">
                            You are not authorized to view this page.
                        </p>
                    </div>
                </div>
                : <Table
                        data={data}
                        setData={setData}
                        updateRow={updateRow}
                        deleteRow={deleteRow}
                        newColumnEnabled={false}
                        addButtonLabel="+ Add User"/>
        }
        </>
    );
}