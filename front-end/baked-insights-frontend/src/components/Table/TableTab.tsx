import { useEffect, useState } from 'react';
import { FaCheck, FaUndo, FaTrash } from 'react-icons/fa';
import Popup from 'reactjs-popup';
import { Tooltip } from 'react-tooltip';

interface TableTabProps {
    tab: {value: string},
    onSelect?: (e: any) => void,
    onSave?: (newTabName: string) => void,
    onDelete?: () => void,
    isActive: boolean,
    isControlTab: boolean,
};


export const TableTab: React.FC<TableTabProps> = ({
    tab,
    onSelect=(() => {}),
    onSave=(() => {}),
    onDelete=(() => {}),
    isActive=false,
    isControlTab=false,
}) => {
    if (isControlTab) {
        return (
            <div className={`border-r border-gray-200 text-center text-sm uppercase font-bold w-24 mb-4 h-10`}>
                <button onClick={onSelect} className="bg-white w-full h-full text-gray-500 hover:bg-gray-50">
                    {tab.value}
                </button>
            </div>
        );
    }
    const [fieldName, setFieldName] = useState<string>("");
    const [edited, setEdited] = useState<boolean>(false);
    const [confirmDeleteInput, setConfirmDeleteInput] = useState<string>("");

    useEffect(() => {
        if (!isControlTab) {
            setFieldName(tab.value);
        }
    }, [tab]);

    const onEditFieldNameHandler = ((e: any) => {
        setFieldName(e.target.value);
        setEdited(true);
    });

    const onUndoHandler = (() => {
        setFieldName(tab.value);
        setEdited(false);
    });

    const onDeleteHandler = (() => {
        onDelete();
    });

    const onSaveHandler = (() => {
        setEdited(false);
        onSave(fieldName);
    });

    const tableTab = (
        <div
            className={`${isActive ? `rounded-b-md border-b border-x border-gray-300 text-gray-500` : `hover:bg-gray-100 border-r border-gray-200 text-gray-400`} flex items-center px-2 py-1 mb-4 text-xs font-bold h-10 min-w-24`}
            onClick={onSelect}
        >
            <button className="text-center w-full h-full">
                {tab.value}
            </button>
        </div>
    );

    const deleteButton = (
        <button
            {...(true && {
                    "data-tooltip-id": "tableheader-delete-tooltip",
                    "data-tooltip-content": "Delete Tab",
                    "data-tooltip-place": "bottom",
                })}
            type="button"
            className={`text-sm text-gray-500 hover:text-pink-700 outline-none px-2`}>
            <FaTrash />
        </button>
    );

    return (
        <Popup
            trigger={tableTab}
            position="top left"
            on={['right-click']}
            arrow={true}
            nested
            closeOnDocumentClick
            closeOnEscape
        >
            <div className="bg-white p-4 drop-shadow-lg rounded-lg flex flex-col">
                <div className="mb-4">
                    <label className="block text-gray-400 text-xs font-bold mb-2">Tab Name</label>
                    <input
                        disabled={false}
                        className={`${true ? "focus:border-sky-300 hover:border-sky-300 text-gray-700" : "text-gray-500"} bg-white w-full h-7 px-1 text-sm rounded-md border border-gray-300 outline-none`}
                        type="text"
                        value={fieldName}
                        onChange={onEditFieldNameHandler}
                    />
                </div>
                <div className="text-center w-full">
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
                        <FaCheck />
                    </button>
                    </>
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
                                <h4 className="font-medium text-slate-500">To confirm deletion, type the name of this tab in the field.</h4>
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
                </div>

            </div>
        </Popup>


    );

}