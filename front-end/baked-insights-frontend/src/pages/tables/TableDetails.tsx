import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Table } from '../../components/Table/Table';
import { ShareTable } from '../../components/Table/ShareTable';
import { TableTab } from '../../components/Table/TableTab';
import { useTableDetails, useTablesManager, useTableSelectData } from '../../hooks/useTables';
import { convertAPITableToTableData, convertTableRowToAPITableDataUpdates } from '../../utils/tableUtils';
import type { TableTabData, TableData } from '../../types/index';
import { IoIosArrowBack } from "react-icons/io";
import { FaTrash } from 'react-icons/fa';
import { FaDownload } from "react-icons/fa6";
import { CSVLink } from "react-csv";


export const TableDetails: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    if (!id) {
        return <></>;
    }

    // Table data state management
    const [title, setTitle] = useState<string>("");
    const [data, setData] = useState<TableTabData[]>([]);
    const [tabDataCSV, setTabDataCSV] = useState<any[][]>([[]]);

    // Tab state management
    const [activeTabIndex, setActiveTabIndex] = useState<number>(0);

    const { deleteTable } = useTablesManager();

    const { 
        tableSelectData,
        isLoadingTableSelectData,
    } = useTableSelectData();

    const {
        // Queries
        tableDetails,
        isLoadingTableDetails,
    
        // Mutations
        updateTable,
        updateTableData,
        deleteTableData,
        updateTableColumn,
        deleteTableColumn,
        createTableTab,
        updateTableTab,
        deleteTableTab,

    } = useTableDetails(+id);

    useEffect(() => {
        if (!isLoadingTableDetails && tableDetails && !isLoadingTableSelectData && tableSelectData) {
            setTitle(tableDetails.name);
            if (tableDetails.tabs?.length) {
                const apiTableTabData = convertAPITableToTableData(tableDetails, tableSelectData);
                apiTableTabData.sort((a, b) => a.tabID - b.tabID);  // Sort tabs within table
                if (apiTableTabData.length) {
                    setData(apiTableTabData);
                }
            }
        }
    }, [tableSelectData, isLoadingTableSelectData, tableDetails, isLoadingTableDetails]);

    // Table management callbacks
    // --
    const updateTitle = () => {
        if (title != tableDetails?.name) {
            updateTable(title);
        }
    };
    // --
    const deleteTableButton = () => {
        const table_id: number = id ? +id: -1;
        deleteTable(table_id);
        navigate("/tables");
    };
    // --
    const prepTabDataCSV = () => {
        if (data) {
            const activeTabData = data[activeTabIndex].data;
            if (activeTabData) {
                let downloadData = [];
                downloadData.push(activeTabData.headers.map((h) => h.dataValue));
                for (var i = 0; i < activeTabData.dataEntries.length; i ++) {
                    downloadData.push(activeTabData.dataEntries[i].map((cell) => cell.dataValue));
                }
                setTabDataCSV(downloadData);
                return true;
            }
            return false;
        }
    };

    // Table Header management callbacks
    // --
    const deleteHeader = (
        colIndex: number,
        successCallback: (data: any, variables: any, context: unknown) => void,
        errorCallback: (data: any, variables: any, context: unknown) => void,
    ) => {
        const editedTabData = data[activeTabIndex].data;
        const colID = editedTabData.headers[colIndex].id; 
        deleteTableColumn(colID, {
            onSuccess: successCallback,
            onError: errorCallback,
        })
    };
    // --
    const updateHeader = (
        colIndex: number,
        fieldName: string,
        fieldType: string,
        successCallback: (data: any, variables: any, context: unknown) => void,
        errorCallback: (data: any, variables: any, context: unknown) => void,
    ) => {
        const tabID = data[activeTabIndex].tabID;
        const editedTabData = data[activeTabIndex].data;
        const colID = (colIndex < editedTabData.headers.length) ? editedTabData.headers[colIndex].id : -1; 
        const updateData = {
            column_id: colID,
            updates: {
                name: fieldName,
                data_type: fieldType,
                tab_id: tabID,
            }
        }
        updateTableColumn(updateData, {
            onSuccess: successCallback,
            onError: errorCallback,
        });

    };

    // Table data management callbacks
    // --
    const setTableData = (tabIndex: number) => {
        return (newTableData: TableData) => {
            setData((prevData: TableTabData[]) => {
                const newData = [...prevData];
                newData[tabIndex].data = newTableData;
                return newData;
            });
        }
    };
    // --
    const updateRow = (
        rowIndex: number,
        tableData: TableData,
        successCallback: (data: any, variables: any, context: unknown) => void,
        errorCallback: (data: any, variables: any, context: unknown) => void,
    ) => {
        const updatedTabID = data[activeTabIndex].tabID;
        const apiUpdates = convertTableRowToAPITableDataUpdates(updatedTabID, rowIndex, tableData, tableSelectData);
        updateTableData(apiUpdates, {
            onSuccess: successCallback,
            onError: errorCallback,
        });
    };
    // --
    const deleteRow = (
        rowIndex: number,
        tableData: TableData,
        successCallback: (data: any, variables: any, context: unknown) => void,
        errorCallback: (data: any, variables: any, context: unknown) => void,
    ) => {
        const recordID = tableData.dataEntries[rowIndex][0].rowIndex;
        deleteTableData(recordID, {
            onSuccess: successCallback,
            onError: errorCallback,
        });

    };

    // Tab management callbacks
    const makeNewTab = () => {
        createTableTab();
    };
    // --
    const onSelectTab = (tabIndex: number) => {
        return (() => {
            setActiveTabIndex(tabIndex);
        });
    };
    // --
    const onSaveTab = (tabIndex: number) => {
        return ((newTabName:string) => {
            updateTableTab({
                tab_id: data[tabIndex].tabID,
                name: newTabName
            })
        });
    };
    // --
    const onDeleteTab = (tabIndex: number) => {
        return (() => {
            deleteTableTab(data[tabIndex].tabID);
            setActiveTabIndex(0);
        });
    };

    if (isLoadingTableDetails) {
        return (
            <div className="flex grow justify-center items-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
            </div>
        );
    } else if (!data.length && !isLoadingTableDetails) {
        return (
            <div className="text-center my-12">
                <h3 className="text-lg font-medium text-gray-900">
                    No Table Here
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                    Either this Table does not exist or you do not have access to view it.
                </p>
            </div>
        );
    }

    return (
    <>
        {/* Table Control */}
        <div className="flex items-center flex-wrap flex-row space-y-0 pb-4">
            <button
                className="mr-auto items-center flex flex-row font-bold text-sm py-1.5 rounded-lg text-gray-500 bg-white hover:text-gray-700"
                onClick={() => {navigate("/tables")}}
            >
                <IoIosArrowBack /> Back
            </button>
            <input
                className="text-center outline-none font-bold rounded-lg border border-white hover:border-sky-300 focus:border-sky-300 text-slate-500 p-1"
                type="text"
                value={title}
                placeholder="Untitled"
                onInput={(e: any) => {setTitle(e.target.value)}}
                onBlur={() => {updateTitle()}}
            />

            <CSVLink
                className="items-center ml-auto mr-4 flex flex-row border font-medium text-sm px-3 py-1.5 rounded-lg text-gray-500 border-gray-300 bg-white hover:text-gray-500 hover:bg-gray-100"
                filename={`${title}-${data[activeTabIndex].tabName}.csv`}
                data={tabDataCSV}
                onClick={prepTabDataCSV}
            >
                    <span className="text-sm"><FaDownload /></span> &nbsp; Download
            </CSVLink>
            <ShareTable
                tableID={+id}/>
            <button
                className="items-center ml-4 flex flex-row border font-medium text-sm px-3 py-1.5 rounded-lg text-gray-500 border-gray-300 bg-white hover:border-red-500 hover:text-red-500 hover:bg-red-100"
                onClick={() => {deleteTableButton()}}
            >
                <span className="text-sm"><FaTrash /></span> &nbsp; Delete Table
            </button>
        </div>
        {/* Table */}
        <Table
            data={data[activeTabIndex].data}
            setData={setTableData(activeTabIndex)}
            updateHeader={updateHeader}
            deleteHeader={deleteHeader}
            updateRow={updateRow}
            deleteRow={deleteRow}
            newColumnEnabled={true}
            addButtonLabel="+ Add Record"/>
        {/* Tabs */}
        <div className="flex flew-row border-t border-gray-200 overflow-x-auto min-h-14">
            {data.map((tab, tabIndex) => (
                <TableTab
                    key={tabIndex}
                    tab={{value: tab.tabName}}
                    onSelect={onSelectTab(tabIndex)}
                    onSave={onSaveTab(tabIndex)}
                    onDelete={onDeleteTab(tabIndex)}
                    isActive={tabIndex == activeTabIndex}
                    isControlTab={false}
                />
            ))}
            <TableTab
                tab={{value: "+"}}
                onSelect={makeNewTab}
                isActive={false}
                isControlTab={true}
            />
        </div>

    </>

    );
}