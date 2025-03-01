export interface APIChecklistTemplate {
    id: number,
    title: string,
    description: string,
    created_by_username: string,
    created_at: string,
    has_checklists: boolean,
    archived: boolean,
    fields?: APIChecklistField[],
}

export interface APIChecklistField {
    id: number,
    order: number,
    name: string,
    description: string,
    data_type: string,
    created_at: string,
    complete_by_time: string,
}

export interface APIChecklist{
    id: number,
    template_id: number,
    template_name: string,
    created_by_username: string,
    created_at: string,
    num_tasks: number,
    num_completed: number,
    submitted: boolean,
}

export interface APIChecklistItem {
    id: number,
    field_id: number,
    order: number,
    value: any,
    value_fpath: string,
    comment: string,
    completed_at: string,
    submitted: boolean,
}


export interface APITemplateShare {
    id: number,
    user_id: number,
    shared_at: string,
}


export const ChecklistFieldTypes = [
    "text",
    "number",
    "boolean",
    "lot-number",
    "sku",
]

export const PrivateChecklistFieldTypes = [
    "time",
    ...ChecklistFieldTypes,
]