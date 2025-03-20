import { makeTableCell, checkValidHeaders } from '../utils/tableUtils';
import { User, TableData, TableCell, TableSelectData } from '../types/index';


export function convertTableRowToUser(rowIndex: number, data: TableData) : User {
    const headers = data.headers;
    const dataEntries = data.dataEntries;

    var user: {[k: string]: any} = {};
    for (var i = 0; i < headers.length; i ++) {
        const headerName = headers[i].dataValue;
        user[headerName] = dataEntries[rowIndex][i].dataValue;
    }
    return user as User;

}

export function convertUsersToTableData(responseData : User[], selectData: TableSelectData) {
    const headers = [
        makeTableCell("primary-key", "id", false, false, -1, -1, selectData),
        makeTableCell("text", "name", false, false, -1, -1, selectData),
        makeTableCell("text", "username", false, false, -1, -1, selectData),
        makeTableCell("password", "password", false, false, -1, -1, selectData),
        makeTableCell("text", "email", false, false, -1, -1, selectData),
        makeTableCell("text", "phone", false, false, -1, -1, selectData),
        makeTableCell("text", "employee_id", false, false, -1, -1, selectData),
        makeTableCell("role", "role", false, false, -1, -1, selectData),
        makeTableCell("boolean", "deactivated", false, false, -1, -1, selectData),
    ];
    checkValidHeaders(headers);
    let dataEntries: TableCell[][] = [];
    for (var i = 0; i < responseData.length; i++) {
        const user = responseData[i];
        const newUser = [
            makeTableCell("primary-key", user.id, false, false, user.id, user.id, selectData),
            makeTableCell("text", user.name, false, false, user.id, user.id, selectData),
            makeTableCell("text", user.username, false, false, user.id, user.id, selectData),
            makeTableCell("password", "", false, false, user.id, user.id, selectData),
            makeTableCell("text", user.email, false, false, user.id, user.id, selectData),
            makeTableCell("text", user.phone? user.phone : "-", false, false, user.id, user.id, selectData),
            makeTableCell("text", user.employee_id, false, false, user.id, user.id, selectData),
            makeTableCell("role", user.role, undefined, undefined, user.id, user.id, selectData),
            makeTableCell("boolean", user.deactivated, false, false, user.id, user.id, selectData),
        ];
        checkValidHeaders(newUser);
        dataEntries.push(newUser);
    }
    const apiData: TableData = {
        headers: headers,
        dataEntries: dataEntries,
    };
    return apiData;
}