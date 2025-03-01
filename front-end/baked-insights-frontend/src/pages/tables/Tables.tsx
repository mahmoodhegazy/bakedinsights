import { useNavigate } from 'react-router-dom';
import { useTablesManager } from '../../hooks/useTables';
import { IoIosArrowForward } from "react-icons/io";

export const Tables = () => {

    const navigate = useNavigate(); 

    const { 
        // Queries
        assignedTables,
        isLoadingAssignedTables,
        // Mutations
        createTable,
    } = useTablesManager();


    const openTable = (table_id: number) => {
        navigate(`/tables/${table_id}`);
    };

    const newTable = () => {
        createTable("New Table");
    };

    const getBody = () => {
        if (isLoadingAssignedTables) {
            return (
                <div className="flex grow justify-center items-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
                </div>
            );
        }

        if (!assignedTables?.length) {
            return (
                <div className="text-center my-12">
                    <h3 className="text-lg font-medium text-gray-900">
                        No Tables
                    </h3>
                    <p className="mt-2 text-sm text-gray-500">
                        You currently have no tables.
                    </p>
                </div>
            );
        }

        return (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 overflow-auto py-4 border-t border-gray-200">
                {assignedTables.map((table) => (
                    <button
                        key={table.id}
                        className="text-left"
                    >
                        <div
                            className="bg-white drop-shadow-md p-4 rounded-md hover:drop-shadow-lg"
                            onClick={() => {openTable(table.id)}}
                        >
                            <h3 className="text-gray-900 font-medium">
                                <div className="flex flex-row">
                                    {table.name}
                                    <IoIosArrowForward className="ml-auto text-md" />
                                </div>
                            </h3>
                            <div className="p-2 text-gray-500 text-xs">
                                <p>Created by <span className="font-bold">{table.created_by_username}</span></p>
                                <p>Created at <span className="font-bold">{new Date(table.created_at).toDateString()}</span></p>
                            </div>
                        </div>
                    </button>
                ))}
            </div>
        );
    }
    
    return (
        <>
        <div className="mb-4 font-bold text-slate-500 flex-col">
            <h1>My Tables</h1>
        </div>
        <div className="flex items-center justify-between flex-wrap flex-row space-y-0 pb-4">
            <button
                className={`text-gray-500 bg-white border-gray-300 inline-flex items-center border hover:bg-gray-100 font-medium rounded-lg text-sm px-3 py-1.5`}
                onClick={newTable}
                type="button">
                <span className="sr-only">Add table button</span>
                + New Table
            </button>
            <label htmlFor="table-search" className="sr-only">Search</label>
            <div className="relative">
                <div className="absolute inset-y-0 rtl:inset-r-0 start-0 flex items-center ps-3 pointer-events-none">
                    <svg className="w-4 h-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"/>
                    </svg>
                </div>
                <input type="text" id="table-search" className="block p-2 ps-10 text-sm text-gray-900 border border-gray-300 rounded-lg w-80 bg-gray-50 focus:ring-blue-500 focus:border-blue-500" placeholder="Search" />
            </div>
        </div>
        {getBody()}
        </>
    );

}