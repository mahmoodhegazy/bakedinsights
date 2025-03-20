export interface APITable {
    id: number,
    name: string,
    creator_by: number,
    created_by_username: string,
    created_at: string,
    tabs?: APITableTab[],
    shares?: APITableShare[],
}

export interface APITableTab {
    id: number,
    name: string,
    tab_index: number,
    data: APIColumnData[],
}

export interface APIColumnData {
    header: APIColumnHeader,
    data: APITableData[],
}

export interface APIColumnHeader {
    column_id: number,
    column_name: string,
    column_data_type: string,
}

export interface APITableData {
    record_id: number,
    value: any,
    data_id: number,
}

export interface APITableShare {
    id: number,
    user_id: number,
    shared_at: string,
}

export interface APITableColumnUpdates {
    column_id: number,
    updates: {
        name?: string,
        data_type?: string,
        col_index?: number,
        tab_id?: number,
    }
}

export interface APITableDataUpdates {
    tab_id: number,
    record_id: number,
    updates: _APITableDataUpdates[],
}

export interface _APITableDataUpdates {
    column_id: number,
    value: any,
}

export interface TableCell {
    dataType: string,
    dataValue: any,
    dataBackup?: any,
    cellEdited: boolean,
    validValues?: string[],
    canEdit?: boolean,
    canDelete?: boolean,
    rowIndex: number,
    id: number,
}

export interface TableData {
    headers: TableCell[],
    dataEntries: TableCell[][]
}

export interface TableTabData {
    tabName: string,
    tabID: number,
    data: TableData,
}

export interface TableSelectInstance {
    value: string,
    id: number, 
}

export interface TableSelectData {
    user: TableSelectInstance[],
    role: TableSelectInstance[],
}

export const TableFieldTypes = [
    "text",
    "long-text",
    "number",
    "boolean",
    "date",
    "file",
    "lot-number",
    "sku",
    "user",
]

export const PrivateTableFieldTypes = [
    "primary-key",
    "password",
    "role",
    ...TableFieldTypes,
]