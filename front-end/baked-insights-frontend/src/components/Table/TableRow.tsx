import { useState } from 'react';
import Popup from 'reactjs-popup';
import { Fragment } from 'react';
import { TableTextCell } from '../../components/Table/TableTextCell';
import { TableSelectCell } from '../../components/Table/TableSelectCell';
import { TableBooleanCell } from '../../components/Table/TableBooleanCell';
import { TableFileCell } from '../../components/Table/TableFileCell';
import { FaCheck, FaUndo, FaTrash } from 'react-icons/fa';
import type { TableCell } from '../../types/index';
import { Tooltip } from 'react-tooltip';

interface TableRowProps {
    rowIndex: number,
    onEditHandler: (rowIndex: number, colIndex: number) => ((e: any) => void),
    onDeleteHandler: (rowIndex: number) => (() => void),
    onUndoHandler: (rowIndex: number) => (() => void),
    onSaveHandler: (rowIndex: number) => (() => void),
    rowData: TableCell[],
    newColumnEnabled: boolean,
    deleteRowLabel: string,
};


export const TableRow : React.FC<TableRowProps> = ({ 
    rowIndex,
    onEditHandler,
    onDeleteHandler,
    onUndoHandler,
    onSaveHandler,
    rowData,
    newColumnEnabled,
    deleteRowLabel="Delete record." 
}) => {

    const [confirmDeleteInput, setConfirmDeleteInput] = useState<string>("");

    const checkRowEdited = (cells: TableCell[]) => {
        let rowStatus = [];
        for (var i = 0; i < cells.length; i++) {
            rowStatus.push(cells[i].cellEdited);
        }
        return rowStatus;
    };

    const deleteButton = (
        <button
            {...(true && {
                    "data-tooltip-id": "tablerow-delete-tooltip",
                    "data-tooltip-content": `${deleteRowLabel}`,
                    "data-tooltip-place": "top",
                })}
            type="button"
            disabled={false}
            className={`text-sm text-gray-500 hover:text-pink-700 mx-2`}>
            <FaTrash />
        </button>
    );

    return (
        <tr key={rowIndex} className="bg-white border-b border-gray-100 h-10 text-gray-500">
            {
                rowData.map((cellData, colIndex) => (
                    ["long-text"].includes(rowData[colIndex].dataType)
                        ? <Fragment key={colIndex}>
                            <TableTextCell
                                type="textarea"
                                caseSensitive={!["sku", "lot-number"].includes(rowData[colIndex].dataType)}
                                value={rowData[colIndex].dataValue}
                                edited={checkRowEdited(rowData)[colIndex]}
                                onEdit={onEditHandler(rowIndex, colIndex)}/>
                            <td />
                            </Fragment>
                    : ["text"].includes(rowData[colIndex].dataType)
                        ? <Fragment key={colIndex}>
                            <TableTextCell
                                type="text"
                                caseSensitive={true}
                                value={rowData[colIndex].dataValue}
                                edited={checkRowEdited(rowData)[colIndex]}
                                onEdit={onEditHandler(rowIndex, colIndex)}/>
                            <td />
                            </Fragment>
                    : ["password"].includes(rowData[colIndex].dataType)
                        ? <Fragment key={colIndex}>
                            <TableTextCell
                                type="password"
                                caseSensitive={true}
                                value={rowData[colIndex].dataValue}
                                edited={checkRowEdited(rowData)[colIndex]}
                                onEdit={onEditHandler(rowIndex, colIndex)}/>
                            <td />
                            </Fragment>
                    : ["sku", "lot-number"].includes(rowData[colIndex].dataType)
                        ? <Fragment key={colIndex}>
                            <TableTextCell
                                type="text"
                                caseSensitive={false}
                                value={rowData[colIndex].dataValue}
                                edited={checkRowEdited(rowData)[colIndex]}
                                onEdit={onEditHandler(rowIndex, colIndex)}/>
                            <td />
                            </Fragment>
                    : ["file"].includes(rowData[colIndex].dataType)
                        ? <Fragment key={colIndex}>
                            <TableFileCell
                                key={colIndex}
                                value={rowData[colIndex].dataValue}
                                edited={checkRowEdited(rowData)[colIndex]}
                                onEdit={onEditHandler(rowIndex, colIndex)}/>
                            <td />
                            </Fragment>
                    : ["number"].includes(rowData[colIndex].dataType)
                        ? <Fragment key={colIndex}>
                            <TableTextCell
                                key={colIndex}
                                type="number"
                                value={rowData[colIndex].dataValue}
                                edited={checkRowEdited(rowData)[colIndex]}
                                onEdit={onEditHandler(rowIndex, colIndex)}/>
                            <td />
                            </Fragment>
                    : ["date"].includes(rowData[colIndex].dataType)
                        ? <Fragment key={colIndex}>
                            <TableTextCell
                                key={colIndex}
                                type="date"
                                value={rowData[colIndex].dataValue}
                                edited={checkRowEdited(rowData)[colIndex]}
                                onEdit={onEditHandler(rowIndex, colIndex)}/>
                            <td />
                            </Fragment>
                    : ["role", "user"].includes(rowData[colIndex].dataType)
                        ? <Fragment key={colIndex}>
                            <TableSelectCell
                                key={colIndex}
                                value={rowData[colIndex].dataValue}
                                items={rowData[colIndex].validValues as string[]}
                                edited={checkRowEdited(rowData)[colIndex]}
                                onEdit={onEditHandler(rowIndex, colIndex)}/>
                            <td />
                            </Fragment>
                    : ["boolean"].includes(rowData[colIndex].dataType)
                        ? <Fragment key={colIndex}>
                            <TableBooleanCell
                                key={colIndex}
                                value={rowData[colIndex].dataValue}
                                edited={checkRowEdited(rowData)[colIndex]}
                                onEdit={onEditHandler(rowIndex, colIndex)}/>
                            <td />
                            </Fragment>
                    : ["primary-key"].includes(rowData[colIndex].dataType)
                        ? <td key={colIndex} className="text-gray-300 font-medium px-2 sticky left-0 bg-white drop-shadow-[1.4px_0px_0.1px_rgba(0,0,0,0.1)]">{rowIndex+1}</td>
                    : <td key={colIndex} className="px-2">{cellData.dataValue}</td>
                ))
            }
            {newColumnEnabled && <td className="w-4 drop-shadow-[-1.4px_0px_0.1px_rgba(0,0,0,0.1)] bg-gray-100"></td>}
            <td className="px-2 min-w-24 sticky right-0 bg-white text-gray-400 drop-shadow-[-1.4px_0px_0.1px_rgba(0,0,0,0.1)]">
                <div className="text-center w-full">
                    <Tooltip id="tablerow-undo-tooltip" />
                    <button
                        {...(checkRowEdited(rowData).includes(true) && {
                                "data-tooltip-id": "tablerow-undo-tooltip",
                                "data-tooltip-content": "Undo changes to record.",
                                "data-tooltip-place": "top",
                            })}
                        type="button"
                        disabled={!checkRowEdited(rowData).includes(true)}
                        onClick={onUndoHandler(rowIndex)}
                        className={`${!checkRowEdited(rowData).includes(true) ? "text-gray-300" : "text-amber-600 hover:text-amber-700"} text-sm mx-1`}>
                        <FaUndo />
                    </button>
                    <Tooltip id="tablerow-save-tooltip" />
                    <button
                        {...(checkRowEdited(rowData).includes(true) && {
                                "data-tooltip-id": "tablerow-save-tooltip",
                                "data-tooltip-content": "Save changes to record.",
                                "data-tooltip-place": "top",
                            })}
                        type="button"
                        disabled={!checkRowEdited(rowData).includes(true)}
                        onClick={onSaveHandler(rowIndex)}
                        className={`${!checkRowEdited(rowData).includes(true) ? "text-gray-300" : "text-sky-500 hover:text-sky-700"} text-sm mx-1`}>
                        <FaCheck />
                    </button>
                    <Tooltip id="tablerow-delete-tooltip" />
                    <Popup
                        trigger={deleteButton}
                        position="left center"
                        on={["click"]}
                        arrow={true}
                    >
                        <div className="bg-white shadow-lg w-64 rounded-lg text-sm border border-gray-200">
                            <div className="p-4">
                                <h4 className="font-medium text-slate-500">To confirm deletion of <span className="font-bold text-red-700">record {rowIndex+1}</span> type <span className="italic font-bold">delete</span> in the field.</h4>
                                <input 
                                    type="text"
                                    placeholder={"delete"}
                                    value={confirmDeleteInput}
                                    onInput={(e: any) => {setConfirmDeleteInput(e.target.value)}}
                                    className="bg-white text-wrap w-full h-7 px-2 text-sm rounded-md border border-gray-300 my-1
                                            focus:border-sky-300 hover:border-sky-300 outline-none italic"
                                />
                                <button
                                    disabled={confirmDeleteInput != "delete"}
                                    className={`${confirmDeleteInput == "delete" ? "bg-red-700 hover:bg-red-900 text-white" : "bg-gray-200 text-gray-300"} button rounded-md text-center p-2 w-full font-bold`}
                                    onClick={onDeleteHandler(rowIndex)}
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </Popup>

                </div>
            </td>
        </tr>


    );
};