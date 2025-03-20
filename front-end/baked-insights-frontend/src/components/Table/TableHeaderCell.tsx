import { useEffect, useState } from 'react';
import Popup from 'reactjs-popup';
import type { TableCell } from '../../types/index';
import { TableFieldTypes } from '../../types/index';
import { FaCheck, FaUndo, FaTrash } from 'react-icons/fa';
import { Tooltip } from 'react-tooltip';


interface TableHeaderCellProps {
    header: TableCell,
    colIndex: number,
    onSave: (colIndex: number, fieldName: string, fieldType: string) => void;
    onDelete: (colIndex: number) => void;
    isControlCell: boolean
};

export const TableHeaderCell: React.FC<TableHeaderCellProps> = ({ header, colIndex, onSave, onDelete, isControlCell=false }) => {
    const [fieldName, setFieldName] = useState<string>("");
    const [fieldType, setFieldType] = useState<string>("");
    const [edited, setEdited] = useState<boolean>(false);
    const [confirmDeleteInput, setConfirmDeleteInput] = useState<string>("");

    useEffect(() => {
        if (!isControlCell) {
            setFieldName(header.dataValue);
        }
        setFieldType(header.dataType);
    }, [header.dataValue, header.dataType]);

    const onEditFieldNameHandler = ((e: any) => {
        setFieldName(e.target.value);
        setEdited(true);
    });

    const onEditFieldTypeHandler = ((e: any) => {
        setFieldType(e.target.value);
        setEdited(true);
    });

    const onUndoHandler = (() => {
        setFieldName(header.dataValue);
        setFieldType(header.dataType);
        setEdited(false);
    });

    const onDeleteHandler = (() => {
        onDelete(colIndex);
    });

    const onSaveHandler = (() => {
        setEdited(false);
        onSave(colIndex, fieldName, fieldType);
        if (isControlCell) {
            setFieldName("");
            setFieldType(header.dataType);
        }
    });

    const tableHeader = (
        <th className="h-8">
            <button 
                className={`${isControlCell ? "text-center text-base min-w-24" : "text-center"} border-none w-full h-full bg-white hover:bg-gray-50 px-3 py-1`}>
                {header.dataValue}
            </button>
        </th>
    );

    const deleteButton = (
        <button
            {...(true && {
                    "data-tooltip-id": "tableheader-delete-tooltip",
                    "data-tooltip-content": "Delete Field",
                    "data-tooltip-place": "bottom",
                })}
            type="button"
            className={`text-sm text-gray-500 hover:text-pink-700 outline-none px-2`}>
            <FaTrash />
        </button>
    );

    return (
        <Popup
            key={colIndex}
            trigger={tableHeader}
            position="bottom left"
            on={[`${isControlCell ? "click" : "right-click"}`]}
            arrow={true}
            nested
        >
            <div className="bg-white p-4 drop-shadow-lg rounded-lg flex flex-col">
                <div className="mb-4">
                    <label className="block text-gray-400 text-xs font-bold mb-2">Field Name</label>
                    <input
                        disabled={!header.canEdit}
                        className={`${header.canEdit ? "focus:border-sky-300 hover:border-sky-300 text-gray-700" : "text-gray-500"} bg-white w-full h-7 px-1 text-sm rounded-md border border-gray-300 outline-none`}
                        type="text"
                        value={fieldName}
                        onChange={onEditFieldNameHandler}
                    />
                </div>
                <div className="mb-4">
                    <label className="block text-gray-400 text-xs font-bold mb-2">Field Type</label>
                    <select
                        disabled={!header.canEdit}
                        className={`${header.canEdit ? "hover:border-sky-300 text-gray-700" : "text-gray-700"} bg-white w-full h-7 px-1 text-sm border rounded-md border-gray-300 outline-none`}
                        value={fieldType}
                        onChange={onEditFieldTypeHandler}
                    >
                        {["-", ...TableFieldTypes].map((v: any, index: number) => (<option key={index} value={v}>{v}</option>))}
                    </select>
                </div>
                <div className="text-center w-full">
                    {(header.canEdit && !isControlCell) &&
                        <>
                        <Tooltip id="tableheader-undo-tooltip" />
                        <button
                            {...(edited && {
                                    "data-tooltip-id": "tableheader-undo-tooltip",
                                    "data-tooltip-content": "Undo",
                                    "data-tooltip-place": "bottom",
                                })}
                            type="button"
                            onClick={onUndoHandler}
                            className={`${!edited ? "text-gray-300" :"text-amber-600 hover:text-amber-700"} text-sm outline-none px-2`}>
                            <FaUndo />
                        </button>
                        </>
                    }
                    {header.canEdit &&
                        <>
                        <Tooltip id="tableheader-save-tooltip" />
                        <button
                            {...(edited && {
                                    "data-tooltip-id": "tableheader-save-tooltip",
                                    "data-tooltip-content": "Save",
                                    "data-tooltip-place": "bottom",
                                })}
                            type="button"
                            onClick={onSaveHandler}
                            className={`${!edited ? "text-gray-300" : "text-sky-500 hover:text-sky-700"} text-sm outline-none px-2`}>
                            {!isControlCell ?
                                <FaCheck />
                                : <div className="text-center">
                                    <p className="text-xs font-bold">Done</p>
                                    <FaCheck className="mx-auto mt-1"/>
                                </div>
                            }
                        </button>
                        </>
                    }
                    {(header.canDelete && !isControlCell) &&
                        <>
                        <Tooltip id="tableheader-delete-tooltip" />
                        <Popup
                            trigger={deleteButton}
                            position="top center"
                            on={["click"]}
                            arrow={true}
                            nested
                        >
                            <div className="bg-white shadow-lg w-64 rounded-lg text-sm border border-gray-200">
                               <div className="p-4">
                                    <h4 className="font-medium text-slate-500">To confirm deletion, type the name of this column in the field.</h4>
                                    <input 
                                        type="text"
                                        placeholder={fieldName}
                                        value={confirmDeleteInput}
                                        onInput={(e: any) => {setConfirmDeleteInput(e.target.value)}}
                                        className="bg-white text-wrap w-full h-7 px-2 text-sm rounded-md border border-gray-300 my-1
                                                focus:border-sky-300 hover:border-sky-300 outline-none italic"
                                    />
                                    <button
                                        disabled={confirmDeleteInput != fieldName}
                                        className={`${confirmDeleteInput == fieldName ? "bg-red-700 hover:bg-red-900 text-white" : "bg-gray-200 text-gray-300"} button rounded-md text-center p-2 w-full font-bold`}
                                        onClick={onDeleteHandler}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </Popup>
                        </>
                    }
                </div>

            </div>
        </Popup>

    );

};