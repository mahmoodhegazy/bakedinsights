import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUsers } from '../../hooks/useUsers';
import { useChecklists, useChecklistTemplates } from '../../hooks/useChecklists';
import { IoIosArrowForward } from "react-icons/io";
import { FaCheck } from 'react-icons/fa';
import Popup from 'reactjs-popup';
import { Tooltip } from 'react-tooltip';
import { Resizable } from 're-resizable';


export const Checklists = () => {
    const navigate = useNavigate(); 
    const [selectedTemplateIndex, setSelectedTemplateIndex] = useState<number>(0);
    const [filteredTemplateIndex, setFilteredTemplateIndex] = useState<number>(0);
    const [filteredChecklistDate, setFilteredChecklistDate] = useState<string>("");

    const { currentUser } = useUsers();

    const { 
        // Queries
        checklists,
        isLoadingChecklists,
        // Mutations
        createChecklist,
    } = useChecklists();

    const { 
        // Queries
        checklistTemplates,
        isLoadingChecklistTemplates,
        // Mutations
        createChecklistTemplate,
    } = useChecklistTemplates();

    const newChecklistTemplate = () => {
        createChecklistTemplate({
            title: "New Template",
            description: "",
        });
    };

    const openChecklistTemplate = (template_id: number) => {
        navigate(`/checklists/templates/${template_id}`);
    };

    const openChecklist= (template_id: number, checklist_id: number) => {
        navigate(`/checklists/templates/${template_id}/checklist/${checklist_id}`);
    };

    const newChecklist = () => {
        if (checklistTemplates && selectedTemplateIndex > 0) {
            createChecklist(checklistTemplates[selectedTemplateIndex-1].id);  // Index 0 is "no selection"
        }
    };

    const getChecklistTemplateBody = () => {

        // Show loading state
        if (isLoadingChecklistTemplates) {
            return (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
                </div>
            );
        }

        // Show empty state
        if (!checklistTemplates?.length) {
            return (
                <div className="max-w-4xl mx-auto py-8 px-4">
                    <div className="text-center py-12">
                    <h3 className="text-lg font-medium text-gray-900">
                        No Templates
                    </h3>
                    <p className="mt-2 text-sm text-gray-500">
                        You currently have no checklist templates.
                    </p>
                    </div>
                </div>
            );
        }

        return (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 overflow-auto py-4 border-t border-gray-200">
                {checklistTemplates.sort((a, b) => b.id - a.id).map((template) => (
                    <button
                        key={template.id}
                        className="text-left"
                    >
                        <div
                            className="bg-white drop-shadow-md p-4 rounded-md hover:drop-shadow-lg"
                            onClick={() => {openChecklistTemplate(template.id)}}
                        >
                            <h4 className="mb-1 uppercase text-xs font-bold text-slate-400">Template</h4>
                            <h3 className="text-gray-900 font-medium flex flex-row">
                                {template.title}
                                <IoIosArrowForward className="ml-auto text-md" />
                            </h3>
                            <div className="p-2 text-gray-500 text-xs">
                                <p>Created by <span className="font-bold">{template.created_by_username}</span></p>
                                <p>Created at <span className="font-bold">{new Date(template.created_at.concat("Z")).toLocaleDateString()}</span></p>
                            </div>
                        </div>
                    </button>
                ))}
            </div>
        );

    }

    const getChecklistsBody = () => {

        // Show loading state
        if (isLoadingChecklists) {
            return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
            </div>
            );
        }

        // Show empty state
        if (!checklists?.length) {
            return (
            <div className="max-w-4xl mx-auto py-8 px-4">
                <div className="text-center py-12">
                <h3 className="text-lg font-medium text-gray-900">
                    No Checklists Assigned
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                    You currently have no checklists assigned to you.
                </p>
                </div>
            </div>
            );
        }

        let filteredChecklists = checklists;
        if (checklistTemplates && filteredTemplateIndex > 0) {
            filteredChecklists = filteredChecklists.filter((checklist) => checklist.template_id === checklistTemplates[filteredTemplateIndex-1].id);
        }
        if (checklistTemplates && filteredChecklistDate) {
            filteredChecklists = filteredChecklists.filter((checklist) => 
                new Date(new Date(checklist.created_at.concat("Z")).toLocaleDateString()).toISOString().slice(0, 10) === filteredChecklistDate);
        }
        if (!filteredChecklists?.length) {
            return (
            <div className="max-w-4xl mx-auto py-8 px-4">
                <div className="text-center py-12">
                <h3 className="text-lg font-medium text-gray-900">
                    No Checklists
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                    No checklists within specified search parameters.
                </p>
                </div>
            </div>
            );
        }

        return (
            <div className="grid gap-6 md:grid-cols-2 overflow-auto py-4 border-t border-gray-200">
                {filteredChecklists.sort((a, b) => b.id - a.id).map((checklist) => (
                    <button
                        key={checklist.id}
                        className="text-left"
                    >
                        <div
                            className="bg-white drop-shadow-md p-4 rounded-md hover:drop-shadow-lg"
                            onClick={() => {openChecklist(checklist.template_id, checklist.id)}}
                        >
                            <h4 className="text-gray-900 font-medium">
                                <div className="flex flex-row">
                                    {checklist.template_name}
                                    <IoIosArrowForward className="ml-auto text-md" />
                                </div>
                            </h4>
                            <div className="p-2 text-gray-500 text-xs">
                                {checklist.submitted
                                    ? <p className="font-bold text-teal-500">Submitted</p>
                                    : <p className="font-bold text-amber-500">Not Submitted</p>
                                }
                                <p>Progress <span className={`${checklist.num_completed === checklist.num_tasks ? "text-teal-500" : "text-amber-500"} font-bold`}>{checklist.num_completed}/{checklist.num_tasks}</span></p>
                                <p>Created by <span className="font-bold">{checklist.created_by_username}</span></p>
                                <p>Created at <span className="font-bold">{new Date(checklist.created_at.concat("Z")).toLocaleString()}</span></p>
                            </div>
                        </div>
                    </button>
                ))}
            </div>
        );
    }
   
    const newChecklistButton = (
        <button
            className={`text-gray-500 bg-white border-gray-300 inline-flex items-center border hover:bg-gray-100 font-medium rounded-lg text-sm px-3 py-1.5`}
            onClick={newChecklist}
            type="button">
            <span className="sr-only">Add checklist button</span>
            + New Checklist
        </button>
    );

    return (
        <>
        {currentUser?.is_admin_role && 
            <>
            <div className="mb-4 font-bold text-slate-500 flex-col">
                <h1>My Templates</h1>
            </div>
            <div className="flex items-center justify-between flex-wrap flex-row space-y-0 pb-4">
                <button
                    className={`text-gray-500 bg-white border-gray-300 inline-flex items-center border hover:bg-gray-100 font-medium rounded-lg text-sm px-3 py-1.5`}
                    onClick={newChecklistTemplate}
                    type="button">
                    <span className="sr-only">Add template button</span>
                    + New Template
                </button>
                <label htmlFor="template-search" className="sr-only">Search</label>
                <div className="relative">
                    <div className="absolute inset-y-0 rtl:inset-r-0 start-0 flex items-center ps-3 pointer-events-none">
                        <svg className="w-4 h-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"/>
                        </svg>
                    </div>
                    <input type="text" id="template-search" className="block p-2 ps-10 text-sm text-gray-900 border border-gray-300 rounded-lg w-80 bg-gray-50 focus:ring-blue-500 focus:border-blue-500" placeholder="Search" />
                </div>
            </div>
            <Resizable
                minHeight={100}
                maxHeight={350}
                className="mb-5 border-b border-gray-200 overflow-auto">
                {getChecklistTemplateBody()}
            </Resizable>
            </>
        }

        <div className="mb-4 font-bold text-slate-500 ">
            <h1>My Checklists</h1>
        </div>
        <div className="flex items-start justify-between flex-wrap flex-row space-y-0 pb-4">
            <Popup
                trigger={newChecklistButton}
                on={['click']}
                position="bottom left"
                arrow={true}
                closeOnDocumentClick
            >
                <div className="bg-white p-4 drop-shadow-lg rounded-lg flex flex-col w-96">
                    <div className="mb-4">
                        <label className="block text-gray-400 text-xs font-bold mb-2">Template</label>
                        <span className="flex flex-row">
                        <select
                            className={`${true ? "hover:border-sky-300 text-gray-700" : "text-gray-700"} bg-white w-full h-7 px-1 text-sm border rounded-md border-gray-300 outline-none`}
                            value={selectedTemplateIndex}
                            onChange={(e: any) => setSelectedTemplateIndex(e.target.value)}
                        >
                            {checklistTemplates?.length 
                                && ["", ...checklistTemplates].map((v: any, index: number) => (<option key={index} value={index}>{v.title}</option>))
                            }
                        </select>
                        <Tooltip id="tableheader-save-tooltip" />
                        <button
                            {...(selectedTemplateIndex > 0 && {
                                    "data-tooltip-id": "tableheader-save-tooltip",
                                    "data-tooltip-content": "Create",
                                    "data-tooltip-place": "bottom",
                                })}
                            type="button"
                            onClick={newChecklist}
                            className={`${selectedTemplateIndex <= 0 ? "text-gray-300" : "text-sky-500 hover:text-sky-700"} text-sm outline-none px-2 ml-2`}>
                            <FaCheck />
                        </button>
                        </span>
                    </div>
                </div>
            </Popup>

            <div className="flex flex-col ml-auto mr-2">
                <select
                    className={`${true ? "hover:border-sky-300 text-gray-700" : "text-gray-700"} bg-white min-w-52 h-8 px-1 text-sm border rounded-md border-gray-300 outline-none`}
                    value={filteredTemplateIndex}
                    onChange={(e: any) => setFilteredTemplateIndex(e.target.value)}
                >
                    {checklistTemplates?.length 
                        && ["", ...checklistTemplates].map((v: any, index: number) => (<option key={index} value={index}>{v.title}</option>))
                    }
                </select>
                <label className="px-1 text-xs font-medium text-slate-400 mb-1">Filter by template</label>
            </div>
            <div className="flex flex-col">
                <input
                    className={`${true ? "hover:border-sky-300 text-gray-700" : "text-gray-700"} bg-white min-w-52 h-8 px-1 text-sm border rounded-md border-gray-300 outline-none`}
                    type="date"
                    value={filteredChecklistDate}
                    onInput={(e: any) => setFilteredChecklistDate(e.target.value)}
                />
                <label className="px-1 text-xs font-medium text-slate-400 mb-1">Filter by date</label>
            </div>
        </div>
        {getChecklistsBody()}
        </>
    );

}