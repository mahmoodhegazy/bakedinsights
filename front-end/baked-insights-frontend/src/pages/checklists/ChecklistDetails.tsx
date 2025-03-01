import { flushSync } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import { Fragment, useEffect, useState } from 'react';
import { IoIosArrowBack } from "react-icons/io";
import { FaTrash } from 'react-icons/fa';
import { useChecklistDetails, useChecklists, useChecklistTemplateDetails } from '../../hooks/useChecklists';
import { APIChecklistField, APIChecklistItem } from '../../types/checklist';

export const ChecklistDetails: React.FC = () => {
    const navigate = useNavigate();
    const { id, cid } = useParams<{ id: string, cid: string }>();
    if (!id || !cid) {
        return <></>;
    }

    // Table data state management
    const [title, setTitle] = useState<string>("");
    const [fields, setFields] = useState<APIChecklistField[]>([]);
    const [items, setItems] = useState<APIChecklistItem[]>([])
    const [isSubmitted, setIsSubmitted] = useState<boolean>(true);

    const {
        // Queries
        checklistTemplateDetails,
        isLoadingChecklistTemplateDetails,
    } = useChecklistTemplateDetails(+id);

    const {
        // Queries
        checklistDetails,
        isLoadingChecklistDetails,

        // Mutations
        updateChecklistItem,
        submitChecklist,
    } = useChecklistDetails(+cid);

    const {
        // Mutations
        deleteChecklist,
    } = useChecklists();

    useEffect(() => {
        if (!isLoadingChecklistTemplateDetails && checklistTemplateDetails && !isLoadingChecklistDetails && checklistDetails) {
            setTitle(checklistTemplateDetails.title);
            if (checklistTemplateDetails.fields) {
                setFields(checklistTemplateDetails.fields.map(f => ({...f})).sort((a, b) => a.order - b.order))
                setItems(checklistDetails.map(f => ({...f})).sort((a, b) => a.order - b.order))
                if (checklistDetails.length) {
                    setIsSubmitted(checklistDetails[0].submitted);
                }
            }
        }
    }, [checklistTemplateDetails, isLoadingChecklistTemplateDetails, checklistDetails, isLoadingChecklistDetails]);

    if (!fields) {
        return <></>;
    }

    const submitChecklistHandler = () => {
        submitChecklist()
        navigate("/checklists");
    };

    const deleteChecklistHandler = () => {
        deleteChecklist(+cid);
        navigate("/checklists");
    };

    const saveItemHandler = (index: number) => {
        if (items[index].value !== "" && items[index].value !== undefined && items[index].value !== null) {
            updateChecklistItem(items[index]);
        }
    };

    const fieldGroup = (index: number) => (
        <Fragment key={index}>
            <p className="block bg-white text-xs mt-6 mb-1 outline-none font-bold border-b border-gray-200 text-slate-600 p-1 mx-auto w-full">
                {fields[index].name}
            </p>
            <p className="block text-xs outline-none font-medium rounded-md text-slate-500 p-1 mx-auto w-full">
                {fields[index].description}
            </p>
            {
                ["text", "sku", "lot-number"].includes(fields[index].data_type)
                    ? <div>
                        <input
                            disabled={isSubmitted}
                            type="text"
                            className={`${!isSubmitted && "hover:border-sky-300"} block text-xs mb-1 outline-none font-medium rounded-md border border-gray-200 focus:border-sky-300 text-slate-600 p-1 mx-auto w-full h-8`}
                            placeholder="Complete task..."
                            value={items[index].value || ""}
                            onInput={(e: any) => {setItems((prevItems: APIChecklistItem[]) => {
                                const newItems = [...prevItems];
                                newItems[index].value = e.target.value;
                                return newItems;
                            })}}
                            onBlur={() => {saveItemHandler(index)}}
                        />
                        <textarea
                            disabled={isSubmitted}
                            className={`${!isSubmitted && "hover:border-sky-300"} block text-xs mb-1 outline-none font-medium rounded-md border border-gray-200 focus:border-sky-300 text-slate-600 p-1 mx-auto w-full min-h-12`}
                            placeholder="Extra comments..."
                            value={items[index].comment || ""}
                            onInput={(e: any) => {setItems((prevItems: APIChecklistItem[]) => {
                                const newItems = [...prevItems];
                                newItems[index].comment = e.target.value;
                                return newItems;
                            })}}
                            onBlur={() => {saveItemHandler(index)}}
                        />
                    </div>
                : ["number"].includes(fields[index].data_type)
                    ? <div>
                        <input
                            disabled={isSubmitted}
                            type="number"
                            className={`${!isSubmitted && "hover:border-sky-300"} block text-xs mb-1 outline-none font-medium rounded-md border border-gray-200 focus:border-sky-300 text-slate-600 p-1 mx-auto w-full h-8`}
                            placeholder="Complete task..."
                            value={items[index].value || ""}
                            onInput={(e: any) => {setItems((prevItems: APIChecklistItem[]) => {
                                const newItems = [...prevItems];
                                newItems[index].value = e.target.value;
                                return newItems;
                            })}}
                            onBlur={() => {saveItemHandler(index)}}
                        />
                        <textarea
                            disabled={isSubmitted}
                            className={`${!isSubmitted && "hover:border-sky-300"} block text-xs mb-1 outline-none font-medium rounded-md border border-gray-200 focus:border-sky-300 text-slate-600 p-1 mx-auto w-full min-h-12`}
                            placeholder="Extra comments..."
                            value={items[index].comment || ""}
                            onInput={(e: any) => {setItems((prevItems: APIChecklistItem[]) => {
                                const newItems = [...prevItems];
                                newItems[index].comment = e.target.value;
                                return newItems;
                            })}}
                            onBlur={() => {saveItemHandler(index)}}
                        />
                    </div>
                : ["time"].includes(fields[index].data_type)
                    ? <div>
                        <input
                            disabled={isSubmitted}
                            type="time"
                            className={`${!isSubmitted && "hover:border-sky-300"} block text-xs mb-1 outline-none font-medium rounded-md border border-gray-200 leading-none focus:border-sky-300 text-slate-500 p-1 mx-auto w-full min-h-8`}
                            min="00:00"
                            max="24:00"
                            value={items[index].value || ""}
                            onInput={(e: any) => {setItems((prevItems: APIChecklistItem[]) => {
                                const newItems = [...prevItems];
                                newItems[index].value = e.target.value;
                                return newItems;
                            })}}
                            onBlur={() => {saveItemHandler(index)}}
                        />
                        <textarea
                            disabled={isSubmitted}
                            className={`${!isSubmitted && "hover:border-sky-300"} block text-xs mb-1 outline-none font-medium rounded-md border border-gray-200 focus:border-sky-300 text-slate-600 p-1 mx-auto w-full min-h-12`}
                            placeholder="Extra comments..."
                            value={items[index].comment || ""}
                            onInput={(e: any) => {setItems((prevItems: APIChecklistItem[]) => {
                                const newItems = [...prevItems];
                                newItems[index].comment = e.target.value;
                                return newItems;
                            })}}
                            onBlur={() => {saveItemHandler(index)}}
                        />
                    </div>
                : ["boolean"].includes(fields[index].data_type)
                    && <div>
                        <div className="flex flex-row items-center border border-gray-200 p-2 rounded-md mb-1">
                            <input
                                disabled={isSubmitted}
                                type="checkbox"
                                className="w-4 h-4"
                                checked={items[index].value !== undefined && items[index].value !== null && items[index].value}
                                onChange={(e: any) => {
                                    flushSync(() => {
                                        setItems((prevItems: APIChecklistItem[]) => {
                                            const newItems = [...prevItems];
                                            newItems[index].value = e.target.checked;
                                            return newItems;
                                        });
                                    });
                                    saveItemHandler(index);
                                }}
                            />
                            <label className="text-xs font-medium text-slate-600 px-2">Yes</label>
                            <input
                                disabled={isSubmitted}
                                type="checkbox"
                                className="w-4 h-4 ml-auto"
                                checked={items[index].value !== undefined && items[index].value !== null && !items[index].value}
                                onChange={(e: any) => {
                                    flushSync(() => {
                                        setItems((prevItems: APIChecklistItem[]) => {
                                            const newItems = [...prevItems];
                                            newItems[index].value = !e.target.checked;
                                            return newItems;
                                        });
                                    });
                                    saveItemHandler(index);
                                }}
                            />
                            <label className="text-xs font-medium text-slate-600 px-2">No</label>
                        </div>
                        <textarea
                            disabled={isSubmitted}
                            className={`${!isSubmitted && "hover:border-sky-300"} block text-xs mb-1 outline-none font-medium rounded-md border border-gray-200 focus:border-sky-300 text-slate-600 p-1 mx-auto w-full min-h-12`}
                            placeholder="Extra comments..."
                            value={items[index].comment || ""}
                            onInput={(e: any) => {setItems((prevItems: APIChecklistItem[]) => {
                                const newItems = [...prevItems];
                                newItems[index].comment = e.target.value;
                                return newItems;
                            })}}
                            onBlur={() => {saveItemHandler(index)}}
                        />
                    </div>
            }
            {fields[index].complete_by_time && 
                <p className="text-xs font-medium text-amber-600 px-1">
                    Required completion time {fields[index].complete_by_time}
                </p>
            }
            {items[index].completed_at && 
                <p className="text-xs font-medium text-teal-600 px-1">
                    Completed at {new Date(items[index].completed_at.concat("Z")).toLocaleTimeString()}.
                </p>
            }
        </Fragment>
    );

    return (
    <>
        {/* Table Control */}
        <div className="flex items-top flex-wrap flex-row space-y-0 pb-4">
            <button
                className="mr-auto items-center flex flex-row font-bold text-sm py-1.5 rounded-lg text-gray-500 bg-white hover:text-gray-700"
                onClick={() => {navigate("/checklists")}}
            >
                <IoIosArrowBack /> Back
            </button>
            <input
                disabled={true}
                className="min-w-32 max-w-60 bg-white w-full text-center outline-none font-bold rounded-lg border border-white text-slate-500 p-1 mx-auto"
                type="text"
                value={title}
                placeholder="Untitled"
            />
            <button
                disabled={isSubmitted}
                className={`${!isSubmitted ? "text-gray-500 border-gray-300 bg-white hover:border-red-500 hover:text-red-500 hover:bg-red-100" : "text-gray-400 border-gray-200 bg-gray-100"} ml-auto mb-auto items-center flex flex-row border font-medium text-sm px-3 py-1.5 rounded-lg`}
                onClick={() => {deleteChecklistHandler()}}
            >
                <FaTrash className='text-sm'/> &nbsp; Delete
            </button>
        </div>
        {!isSubmitted
            ? <div className="flex items-center justify-between flex-wrap flex-row space-y-0 pb-4">
                <button
                    disabled={false}
                    type="submit"
                    className={`${false ? "bg-gray-300 text-white" : "bg-gray-700 hover:bg-gray-900 text-white"} ml-auto text-left py-2 px-4 border-none outline-none text-sm font-medium rounded-md h-9`}
                    onClick={() => submitChecklistHandler()}
                >
                    Submit Checklist
                </button>
            </div>
            : <p className="text-xs text-center mx-auto italic text-gray-500 pb-4">
                This checklist has been submitted and can no longer be modified.
            </p>
        }
        <div className="px-8 py-4 border-t border-gray-300 w-full mb-4 overflow-auto">
            <div className="min-w-32 max-w-60 mx-auto">
                {fields.map((_, index) => fieldGroup(index))}
            </div>
        </div>

    </>
  );
}