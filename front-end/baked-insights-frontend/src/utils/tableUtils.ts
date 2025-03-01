import { 
    APITable,
    TableData,
    TableCell,
    TableTabData,
    TableSelectData,
    PrivateTableFieldTypes,
    APITableDataUpdates
} from '../types/index';


export function makeTableCell (
    dataType: string,
    dataValue: any,
    canEdit?: boolean,
    canDelete?: boolean,
    id: number = -1,
    rowIndex: number = -1,
    selectData: TableSelectData | undefined = undefined,
) : TableCell {

    let validValues = ["-"];
    if (selectData && (dataType in selectData)) {
        selectData[dataType as keyof TableSelectData].map((v) => {validValues.push(v.value)});
    }

    return {
        dataType: dataType,
        dataValue: dataValue,
        cellEdited: false,
        validValues: validValues,
        canEdit: canEdit,
        canDelete: canDelete,
        rowIndex: rowIndex,
        id: id,
    };
}

export function checkValidHeaders (headers: TableCell[]) {
    if (!headers.map((h) => PrivateTableFieldTypes.includes(h.dataType)).every(v => v === true)) {
        throw new Error("Some headers are not valid types");
    }
}

export function convertTableRowToAPITableDataUpdates(tabID: number, rowIndex: number, data: TableData, selectData: TableSelectData | undefined) : APITableDataUpdates {
        const updatedRow = data.dataEntries[rowIndex];
        const recordID = updatedRow[0].rowIndex;
        const updates = [];
        for (var i = 0; i < updatedRow.length; i++) {
            const cell = updatedRow[i];
            if (cell.cellEdited) {
                if (selectData && cell.dataType in selectData) {
                    const selected = selectData[cell.dataType as keyof TableSelectData].find(obj => {return obj.value === cell.dataValue});
                    if (selected) {
                        updates.push({
                            column_id: data.headers[i].id,
                            value: selected.id,
                        })
                    }
                } else {
                    updates.push({
                        column_id: data.headers[i].id,
                        value: cell.dataValue,
                    })
                }
            }
        }
        return {
            tab_id: tabID,
            record_id: recordID,
            updates:  updates,
        };
}

export function convertAPITableToTableData(responseData : APITable, selectData: TableSelectData) : TableTabData[] {
    const tabs = responseData.tabs;
    if (!tabs) {
        return [];
    }

    const apiData: TableTabData[] = [];

    for (var tabIndex = 0; tabIndex < tabs.length; tabIndex++) {
        const tab = tabs[tabIndex];

        const tabData = tab.data;
        tabData.sort((a, b) => a.header.column_id - b.header.column_id);  // Sort columns within tab

        // -- Get num rows / num columns / row indices
        var rowIndexSet = new Set<number>();
        for (var i = 0; i < tabData.length; i++) {
            for (j = 0; j < tabData[i].data.length; j++) {
                rowIndexSet.add(tabData[i].data[j].record_id);
            }
        }
        const rowIndices: number[] = [...rowIndexSet];
        rowIndices.sort((a, b) => a - b);  // Sort rows within column
        const numColumns = tabData.length;
        const numRows = Math.max(...tabData.map((col) => (col.data.length)));

        const headers: TableCell[] = [];
        const dataEntries: TableCell[][] = [];

        // -- make headers
        headers.push(makeTableCell("primary-key", "id", false, false));
        for (var k = 0; k < numColumns; k++) {
            headers.push(makeTableCell(
                tabData[k].header.column_data_type,
                tabData[k].header.column_name,
                true, true, tabData[k].header.column_id, tabData[k].header.column_id, selectData,
            ))
        }
        // -- make dataEntries
        for (var j = 0; j < numRows; j++) {
            const newRow: TableCell[] = [];
            const rowIndex = rowIndices[j];

            newRow.push(makeTableCell("primary-key", tab.id, false, false, -1, rowIndex));
            for (var k = 0; k < numColumns; k++) {
                const dataType = tabData[k].header.column_data_type
                const cell = tabData[k].data.find(colData => colData.record_id === rowIndex)
                if (!cell) {
                    newRow.push(makeTableCell(
                        dataType, "", true, true, -1, rowIndex, selectData,
                    ))
                } else {
                    if (dataType in selectData) {
                        const selected = selectData[dataType as keyof TableSelectData].find(obj => {return obj.id === cell.value});
                        if (selected) {
                            newRow.push(makeTableCell(
                                dataType, selected.value, true, true, cell.data_id, rowIndex, selectData,
                            ))
                        } else {
                            newRow.push(makeTableCell(
                                dataType, "", true, true, -1, rowIndex, selectData,
                            ))
                        }
                    } else {
                        let val = cell.value;
                        if (dataType === "date") {
                            val = new Date(val).toISOString().slice(0, 10);
                        }
                        newRow.push(makeTableCell(
                            dataType, val, true, true, cell.data_id, rowIndex, selectData,
                        ))
                    }
                }
            }
            dataEntries.push(newRow);
        }
        apiData.push({
            tabName: tab.name,
            tabID: tab.id,
            data: {
                headers: headers,
                dataEntries: dataEntries,
            }
        });
    }
    return apiData;
}