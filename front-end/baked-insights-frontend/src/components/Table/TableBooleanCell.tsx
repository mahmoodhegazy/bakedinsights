interface TableBooleanCellProps {
    value: boolean | null | undefined,
    onEdit: (e: any) => void,
    edited: boolean,
};

export const TableBooleanCell : React.FC<TableBooleanCellProps> = ({ value, onEdit, edited}) => {
    // Render a checkbox input within a table cell
    // The checkbox is checked if value is true, unchecked if false, null, or undefined    
    return (
        <td className="min-w-24 h-7">
            <div
                className={`${edited ? `text-sky-700 bg-sky-100 font-medium` : `bg-white`} py-2 text-center w-full text-sm rounded-md border border-white focus:border-sky-300 hover:border-sky-300 outline-none`}
            >
                <input
                    className="outline-none"
                    type="checkbox"
                    checked={Boolean(value)} // Convert null/undefined to false (unchecked state)
                    onChange={(e: any) => {onEdit(e.target.checked)}}
                />
            </div>
        </td>
    );
};