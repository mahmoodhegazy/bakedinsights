import { useParams, useNavigate } from 'react-router-dom';
import { Fragment, useEffect, useState } from 'react';
import { IoIosArrowBack } from "react-icons/io";
import { FaArrowCircleDown, FaTrash, FaArrowCircleUp } from 'react-icons/fa';
import { useChecklistTemplates, useChecklistTemplateDetails } from '../../hooks/useChecklists';
import { APIChecklistField, ChecklistFieldTypes } from '../../types/checklist';
import { ShareTemplate } from '../../components/Checklist/ShareTemplate';

export const ChecklistTemplateDetails: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    if (!id) {
        return <></>;
    }

    // Table data state management
    const [title, setTitle] = useState<string>("");
    const [edited, setEdited] = useState<boolean>(false);
    const [fields, setFields] = useState<APIChecklistField[]>([]);
    const [hasChecklists, setHasChecklists] = useState<boolean>(true);

    const {
        // Queries
        checklistTemplateDetails,
        isLoadingChecklistTemplateDetails,
        // Mutations
        updateChecklistTemplate,
        deleteField,
    } = useChecklistTemplateDetails(+id);

    const {
        deleteChecklistTemplate,
    } = useChecklistTemplates();

    useEffect(() => {
        if (!isLoadingChecklistTemplateDetails && checklistTemplateDetails) {
            setTitle(checklistTemplateDetails.title);
            if (checklistTemplateDetails.fields) {
                setFields(checklistTemplateDetails.fields.map(f => ({...f})).sort((a, b) => a.order - b.order));
                setHasChecklists(checklistTemplateDetails.has_checklists);
            }
        }
    }, [checklistTemplateDetails, isLoadingChecklistTemplateDetails]);

    if (!fields) {
        return <></>;
    }

    const updateTitle = () => {
        if (checklistTemplateDetails) {
            const newTemplate = {...checklistTemplateDetails};
            newTemplate.title = title;
            updateChecklistTemplate(newTemplate);
        }
    };

    const deleteTemplateHandler = () => {
        deleteChecklistTemplate(+id);
        navigate("/checklists");
        
    }

    const saveFieldsHandler = () => {
        if (checklistTemplateDetails) {
            const newTemplate = {...checklistTemplateDetails};
            newTemplate.fields = fields;
            updateChecklistTemplate(newTemplate, {
                onSuccess: () => {setEdited(false)},
                onError: () => {},
            });
        }
    };

    const deleteFieldHandler = (index: number) => {
        return () => {
            const field_id = fields[index].id
            if (field_id >= 0){
                deleteField(field_id);
            } else {
                setFields((prevFields) => {
                    let newFields = prevFields.map(f => ({...f}));
                    newFields.splice(index, 1);
                    return newFields;
                })
            }

        };
    };

    const addFieldHandler = () => {
        setFields((prevFields: APIChecklistField[]) => {
            const newFields = prevFields.map(f => ({...f}));
            const newField: APIChecklistField =  {
                id: -1,
                order: newFields.length,
                name: "",
                description: "",
                data_type: "-",
                created_at: "",
                complete_by_time: "",
            };
            newFields.push(newField);
            return newFields;
        });
    };

    const updateOrder = (index: number, newIndex: number) => {
        if (checklistTemplateDetails && newIndex >= 0 && newIndex < fields.length) {
            const newTemplate = {...checklistTemplateDetails};
            newTemplate.fields = fields.map((f) => ({...f}));
            newTemplate.fields[index].order = newIndex;
            newTemplate.fields[newIndex].order = index;
            updateChecklistTemplate(newTemplate, {
                onSuccess: () => {setEdited(false)},
                onError: () => {},
            });
        }
    };

    const fieldGroup = (index: number) => (
        <Fragment key={index}>
            <div className="flex flex-row-reverse text-slate-400 gap-2 items-baseline mb-1">
                <button onClick={() => updateOrder(index, index-1)}>
                    <FaArrowCircleUp />
                </button>
                <button onClick={() => updateOrder(index, index+1)}>
                    <FaArrowCircleDown/>
                </button>
            </div>
            <input
                disabled={hasChecklists}
                className={`${!hasChecklists && "hover:border-sky-300"} block text-xs mb-1 outline-none font-bold border-b border-gray-200 focus:border-sky-300 text-slate-600 p-1 mx-auto w-full h-8`}
                type="text"
                required
                value={fields[index].name}
                placeholder="Field name..." 
                onInput={(e: any) => {setFields((prevFields: APIChecklistField[]) => {
                    setEdited(true);
                    const newFields = [...prevFields];
                    newFields[index].name = e.target.value;
                    return newFields;
                })}}
            />
            <textarea
                disabled={hasChecklists}
                className={`${!hasChecklists && "hover:border-sky-300"} block text-xs mb-1 outline-none font-medium rounded-md border border-gray-200 focus:border-sky-300 text-slate-500 p-1 mx-auto w-full min-h-12`}
                value={fields[index].description}
                placeholder="Instructions..."
                onInput={(e: any) => {setFields((prevFields: APIChecklistField[]) => {
                    setEdited(true);
                    const newFields = [...prevFields];
                    newFields[index].description = e.target.value;
                    return newFields;
                })}}
            />
            <select
                disabled={hasChecklists}
                className={`${!hasChecklists ? "hover:border-sky-300 text-gray-700" : "text-gray-700"} bg-white w-full h-7 px-1 text-sm border rounded-md border-gray-300 outline-none`}
                value={fields[index].data_type}
                onChange={(e: any) => {setFields((prevFields: APIChecklistField[]) => {
                    setEdited(true);
                    const newFields = [...prevFields];
                    newFields[index].data_type = e.target.value;
                    return newFields;
                })}}
            >
                {["-", ...ChecklistFieldTypes].map((v: any, index: number) => (<option key={index} value={v}>{v}</option>))}
            </select>
            <label className="text-xs font-medium text-slate-400">Required completion time (optional)</label>
            <input
                disabled={hasChecklists}
                type="time"
                className={`${!hasChecklists && "hover:border-sky-300"} block text-xs mb-1 outline-none font-medium rounded-md border border-gray-200 leading-none focus:border-sky-300 text-slate-500 p-1 mx-auto w-full min-h-8`}
                min="00:00"
                max="24:00"
                value={fields[index].complete_by_time ? fields[index].complete_by_time : ""}
                onChange={(e: any) => {setFields((prevFields: APIChecklistField[]) => {
                    setEdited(true);
                    const newFields = [...prevFields];
                    newFields[index].complete_by_time = e.target.value;
                    return newFields;
                })}}
            />
            <button
                disabled={hasChecklists}
                className={`${!hasChecklists ? "text-gray-500 border-gray-300 bg-white hover:border-red-500 hover:text-red-500 hover:bg-red-100" : "text-gray-400 border-gray-200 bg-gray-100"} flex flex-row text-xs items-center mt-2 mb-8 border rounded-md p-1`}
                onClick={deleteFieldHandler(index)}
            >
                <FaTrash/> &nbsp; Delete Field
            </button>

        </Fragment>
    );

    return (
    <>
        {/* Table Control */}
        <div className="flex items-center flex-wrap flex-row space-y-0 pb-4">
            <button
                className="mr-auto items-center flex flex-row font-bold text-sm py-1.5 rounded-lg text-gray-500 bg-white hover:text-gray-700"
                onClick={() => {navigate("/checklists")}}
            >
                <IoIosArrowBack /> Back
            </button>
            <ShareTemplate templateID={+id}/>
            <button
                className="ml-4 mb-auto items-center flex flex-row border font-medium text-sm px-3 py-1.5 rounded-lg text-gray-500 border-gray-300 bg-white hover:border-red-500 hover:text-red-500 hover:bg-red-100"
                onClick={() => {deleteTemplateHandler()}}
            >
                <FaTrash className='text-sm'/> &nbsp; {checklistTemplateDetails?.archived ?  "Unarchive" : hasChecklists ? "Archive" : "Delete"}
            </button>
        </div>
        <h4 className="uppercase p-1 text-sm font-bold text-slate-400">Template</h4>
        <input
            className="w-full text-left outline-none font-bold rounded-lg border border-white hover:border-sky-300 focus:border-sky-300 text-slate-500 p-1 mb-2"
            type="text"
            value={title}
            placeholder="Untitled"
            onInput={(e: any) => {setTitle(e.target.value)}}
            onBlur={() => {updateTitle()}}
        />
        {!hasChecklists
            ? <div className="flex items-center justify-between flex-wrap flex-row space-y-0 pb-4">
                <button
                    disabled={hasChecklists}
                    className={`${hasChecklists ? "text-gray-300 bg-gray-100 border-gray-100": "hover:bg-gray-100 text-gray-500 bg-white border-gray-300"} inline-flex items-center border font-medium rounded-lg text-sm px-3 py-1.5`}
                    onClick={addFieldHandler}
                    type="button">
                    <span className="sr-only">Add field</span>
                    + Add Field
                </button>
                <button
                    disabled={!edited || hasChecklists}
                    type="submit"
                    className={`${!edited ? "bg-gray-300 text-white" : "bg-gray-700 hover:bg-gray-900 text-white"} ml-auto text-left py-2 px-4 border-none outline-none text-sm font-medium rounded-md`}
                    onClick={() => saveFieldsHandler()}
                >
                    Save Changes
                </button>
            </div>
            : <p className="text-xs text-left w-full italic text-gray-500 pb-4 px-1">
                This template was used to create a checklist and can longer be modified.
            </p>
        }
        <div className="px-8 py-4 border-t border-gray-300 w-full mb-4 overflow-auto">
            <div className="min-w-32 max-w-60 mx-auto pt-4">
                {fields.map((_, index) => fieldGroup(index))}
            </div>
        </div>

    </>
  );
}