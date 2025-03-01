interface TableTextCellProps {
    value: string,
    onEdit: (e: any) => void,
    edited: boolean,
    type?: string,
    caseSensitive?: boolean,
};


export const TableTextCell : React.FC<TableTextCellProps> = ({ value, onEdit, edited, type="text", caseSensitive=true }) => {
    return (
        <td className="min-w-40">
            <input
                className={`${edited ? `text-sky-700 bg-sky-100 font-medium` : `bg-white`} ${!caseSensitive && `uppercase`} w-full h-7 px-2 text-sm rounded-md border border-white focus:border-sky-300 hover:border-sky-300 outline-none`}
                type={type}
                value={value}
                onInput={(e: any) => onEdit(e.target.value)}
            />
        </td>
    );
};