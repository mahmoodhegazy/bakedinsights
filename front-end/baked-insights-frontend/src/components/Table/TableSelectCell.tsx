interface TableSelectCellProps {
    items: string[],
    value: string,
    onEdit: (e: any) => void,
    edited: boolean,
};


export const TableSelectCell : React.FC<TableSelectCellProps> = ({items, value, onEdit, edited}) => {
    return (
        <td className="min-w-24">
            <select
                className={`${edited ? `text-sky-700 bg-sky-100 font-medium` : `bg-white`} w-full h-7 px-1 text-sm rounded-md border border-white hover:border-sky-300 outline-none`}
                value={value}
                onInput={(e: any) => onEdit(e.target.value)}
            >
                {items.map((v: any, index: number) => (<option key={index} value={v}>{v}</option>))}
            </select>
        </td>
    );
};