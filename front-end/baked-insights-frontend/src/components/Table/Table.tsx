import { useState, useCallback, useMemo } from 'react';
import { TableRow } from './TableRow';
import { TableHeaders } from './TableHeaders';
import type { TableData, TableCell } from '../../types/index';

const ROWS_PER_PAGE = 50;

interface TableProps {
    data: TableData,
    setData: (data: TableData) => void,
    updateHeader?: (
        colIndex: number,
        fieldName: string,
        fieldType: string,
        successCallback: (data: any, variables: any, context: unknown) => void,
        errorCallback: (data: any, variables: any, context: unknown) => void,
    ) => void,
    deleteHeader?: (
        colIndex: number,
        successCallback: (data: any, variables: any, context: unknown) => void,
        errorCallback: (data: any, variables: any, context: unknown) => void,
    ) => void,
    updateRow: (
        rowIndex: number,
        data: TableData,
        successCallback: (data: any, variables: any, context: unknown) => void,
        errorCallback: (data: any, variables: any, context: unknown) => void,
    ) => void,
    deleteRow: (
        rowIndex: number,
        data: TableData,
        successCallback: (data: any, variables: any, context: unknown) => void,
        errorCallback: (data: any, variables: any, context: unknown) => void,
    ) => void,
    newColumnEnabled: boolean,
    addButtonLabel: string,
    deleteRowLabel?: string,
};

export const Table : React.FC<TableProps> = ({
    data, setData,
    updateHeader,
    deleteHeader,
    updateRow,
    deleteRow,
    newColumnEnabled,
    addButtonLabel="+ Add Record",
    deleteRowLabel="Delete record."
}) => {
    const [currentPage, setCurrentPage] = useState(1);

    const totalRows = data.dataEntries.length;
    const totalPages = Math.ceil(totalRows / ROWS_PER_PAGE);
    const isLargeDataset = totalRows > ROWS_PER_PAGE;

    const paginatedData = useMemo(() => {
        if (!isLargeDataset) {
            return data.dataEntries;
        }
        const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
        const endIndex = startIndex + ROWS_PER_PAGE;
        return data.dataEntries.slice(startIndex, endIndex);
    }, [data.dataEntries, currentPage, isLargeDataset]);

    const getActualRowIndex = (displayIndex: number) => {
        if (!isLargeDataset) return displayIndex;
        return (currentPage - 1) * ROWS_PER_PAGE + displayIndex;
    };

    const getDefaultCell = (header: TableCell, newRowIndex: number) => {
        switch (header.dataType) {
            default:
                return {
                    dataType: header.dataType,
                    dataValue: "",
                    cellEdited: false,
                    validValues: header.validValues,
                    id: -1,
                    rowIndex: newRowIndex,
                };
        }
    };

    const addRowHandler = () => {
        const {headers: prevHeaders, dataEntries: prevDataEntries} = data;
        const newRow = prevHeaders.map((header) => (getDefaultCell(header, -1)));
        const newTableData = {
            headers: prevHeaders,
            dataEntries: [...prevDataEntries, newRow],
        };
        setData(newTableData);
        if (isLargeDataset) {
            setCurrentPage(Math.ceil((prevDataEntries.length + 1) / ROWS_PER_PAGE));
        }
    };

    const deleteRowHandler = useCallback((displayIndex: number) => {
        const rowIndex = getActualRowIndex(displayIndex);
        return (() => {
            if (data.dataEntries[rowIndex][0].rowIndex === -1) {
                const {headers: prevHeaders, dataEntries: prevDataEntries} = data;
                const newDataEntries = [...prevDataEntries];
                newDataEntries.splice(rowIndex, 1);
                const newTableData = {
                    headers: prevHeaders,
                    dataEntries: newDataEntries,
                };
                setData(newTableData);
            } else {
                deleteRow(rowIndex, {
                    headers: data.headers.map((cell) => ({...cell})),
                    dataEntries: data.dataEntries.map((row) => (row.map((cell) => ({...cell})))),
                }, () => {}, () => {});
            }
        });
    }, [data, setData, deleteRow, currentPage, isLargeDataset]);

    const undoRowHandler = useCallback((displayIndex: number) => {
        const rowIndex = getActualRowIndex(displayIndex);
        return (() => {
            const {headers: prevHeaders, dataEntries: prevDataEntries} = data;
            const newRowEntries = prevDataEntries[rowIndex].map((cell) => ({...cell}));
            for (var i = 0; i < newRowEntries.length; i++) {
                const cell = newRowEntries[i];
                if (cell.cellEdited) {
                    cell.dataValue = cell.dataBackup;
                    cell.cellEdited = false;
                    delete cell.dataBackup;
                }
            }
            const newDataEntries = prevDataEntries.map((row) => (row.map((cell) => ({...cell}))));
            newDataEntries[rowIndex] = newRowEntries;
            const newTableData = {
                headers: prevHeaders,
                dataEntries: newDataEntries,
            };
            setData(newTableData);
        });
    }, [data, setData, currentPage, isLargeDataset]);

    const editCellHandler = useCallback((displayIndex: number, colIndex: number) => {
        const rowIndex = getActualRowIndex(displayIndex);
        return ((newValue: any) => {
            const {headers: prevHeaders, dataEntries: prevDataEntries} = data;
            const newCell = {...prevDataEntries[rowIndex][colIndex]};
            if (!newCell.cellEdited) {
                newCell.cellEdited = true;
                newCell.dataBackup = newCell.dataValue;
            }
            newCell.dataValue = newValue;
            const newDataEntries = prevDataEntries.map((row) => (row.map((cell) => ({...cell}))));
            newDataEntries[rowIndex][colIndex] = newCell;
            const newTableData = {
                headers: prevHeaders,
                dataEntries: newDataEntries,
            };
            setData(newTableData);
        });
    }, [data, setData, currentPage, isLargeDataset]);

    const saveCellHandler = useCallback((displayIndex: number) => {
        const rowIndex = getActualRowIndex(displayIndex);
        return (() => {
            const prevHeaders = data.headers.map((cell) => ({...cell}));
            const newDataEntries = data.dataEntries.map((row) => (row.map((cell) => ({...cell}))));
            for (var i = 0; i < newDataEntries[rowIndex].length; i++) {
                delete newDataEntries[rowIndex][i].dataBackup;
            }
            const newTableData = {
                headers: prevHeaders,
                dataEntries: newDataEntries,
            };
            updateRow(rowIndex, newTableData, () => {}, () => {});
        });

    }, [data, updateRow, currentPage, isLargeDataset]);

    const saveHeaderHandler = (colIndex: number, fieldName: string, fieldType: string) => {
        if (updateHeader) {
            updateHeader(colIndex, fieldName, fieldType, () => {}, () => {});
        }
    };

    const deleteHeaderHandler = (colIndex: number) => {
        if (deleteHeader) {
            deleteHeader(colIndex, () => {}, () => {});
        }
    };

    const makeHeaders = (headers: TableCell[]) => (
        <TableHeaders
            headers={headers}
            newColumnEnabled={newColumnEnabled}
            onSaveHandler={saveHeaderHandler}
            onDeleteHandler={deleteHeaderHandler}
        />
    );

    const makeRow = (rowData: TableCell[], displayIndex: number) => (
        <TableRow
            key={displayIndex}
            rowIndex={displayIndex}
            onDeleteHandler={deleteRowHandler}
            onEditHandler={editCellHandler}
            onUndoHandler={undoRowHandler}
            onSaveHandler={saveCellHandler}
            rowData={rowData}
            newColumnEnabled={newColumnEnabled}
            deleteRowLabel={deleteRowLabel}
        />
    );

    const goToPage = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    const renderPagination = () => {
        if (!isLargeDataset) return null;

        const startRow = (currentPage - 1) * ROWS_PER_PAGE + 1;
        const endRow = Math.min(currentPage * ROWS_PER_PAGE, totalRows);

        const pageNumbers: (number | string)[] = [];
        const maxVisiblePages = 5;
        
        if (totalPages <= maxVisiblePages) {
            for (let i = 1; i <= totalPages; i++) {
                pageNumbers.push(i);
            }
        } else {
            pageNumbers.push(1);
            
            if (currentPage > 3) {
                pageNumbers.push('...');
            }
            
            const start = Math.max(2, currentPage - 1);
            const end = Math.min(totalPages - 1, currentPage + 1);
            
            for (let i = start; i <= end; i++) {
                if (!pageNumbers.includes(i)) {
                    pageNumbers.push(i);
                }
            }
            
            if (currentPage < totalPages - 2) {
                pageNumbers.push('...');
            }
            
            if (!pageNumbers.includes(totalPages)) {
                pageNumbers.push(totalPages);
            }
        }

        return (
            <div className="flex items-center justify-between py-3 border-t border-gray-200">
                <div className="text-sm text-gray-500">
                    Showing {startRow.toLocaleString()} - {endRow.toLocaleString()} of {totalRows.toLocaleString()} rows
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => goToPage(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-3 py-1 text-sm border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                    >
                        Previous
                    </button>
                    
                    {pageNumbers.map((page, index) => (
                        typeof page === 'number' ? (
                            <button
                                key={index}
                                onClick={() => goToPage(page)}
                                className={`px-3 py-1 text-sm border rounded-md ${
                                    currentPage === page 
                                        ? 'bg-blue-500 text-white border-blue-500' 
                                        : 'hover:bg-gray-100'
                                }`}
                            >
                                {page}
                            </button>
                        ) : (
                            <span key={index} className="px-2 text-gray-400">
                                {page}
                            </span>
                        )
                    ))}
                    
                    <button
                        onClick={() => goToPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 text-sm border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                    >
                        Next
                    </button>
                </div>
            </div>
        );
    };

    return (
        <>
        <div className="flex items-center justify-between flex-wrap flex-row gap-2 pb-4">
            <button
                className={`${false ? "text-gray-300 bg-gray-50 border-gray-100": "text-gray-500 bg-white border-gray-300"} inline-flex items-center border hover:bg-gray-100 font-medium rounded-lg text-sm px-3 py-1.5`}
                onClick={addRowHandler}
                type="button">
                <span className="sr-only">Add row button</span>
                {addButtonLabel}
            </button>
            <div className="flex items-center gap-2">
                {isLargeDataset && (
                    <span className="text-xs text-gray-400">
                        {totalRows.toLocaleString()} rows total
                    </span>
                )}
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
        </div>
        <div className="overflow-auto">
            <table className="table-auto w-full text-sm text-left">
                <thead className="sticky top-0 text-xs text-gray-700 bg-white drop-shadow-md">
                    {makeHeaders(data.headers)}
                </thead>
                <tbody className="order-last">
                    {paginatedData.map(makeRow)}
                </tbody>
            </table>
        </div>
        {renderPagination()}
        </>
    );
};
