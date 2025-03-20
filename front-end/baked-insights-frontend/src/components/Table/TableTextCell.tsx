interface TableTextCellProps {
    value: string,
    onEdit: (e: any) => void,
    edited: boolean,
    type?: string,
    caseSensitive?: boolean,
};


export const TableTextCell : React.FC<TableTextCellProps> = ({ value, onEdit, edited, type="text", caseSensitive=true }) => {

    const formatText = (val : string) => {
        if (!caseSensitive) {
            return val.toUpperCase();
        }
        return val
    };

    return (
        <td className="min-w-24">
            {type == "textarea" ?
                <textarea
                    className={`${edited ? `text-sky-700 bg-sky-100 font-medium` : `bg-white`} text-wrap w-full min-h-7 px-2 text-sm rounded-md border border-white focus:border-sky-300 hover:border-sky-300 outline-none`}
                    value={value}
                    onInput={(e: any) => onEdit(formatText(e.target.value))}
                />
            : type == "password" ?
                <input
                    type={"text"}
                    className={`${edited ? `text-sky-700 bg-sky-100 font-medium` : `bg-white`} text-wrap w-full h-7 px-2 text-sm rounded-md border border-white focus:border-sky-300 hover:border-sky-300 outline-none`}
                    value={value}
                    placeholder="*****"
                    onInput={(e: any) => onEdit(formatText(e.target.value))}
                />
            : <input
                type={type}
                className={`${edited ? `text-sky-700 bg-sky-100 font-medium` : `bg-white`} text-wrap w-full h-7 px-2 text-sm rounded-md border border-white focus:border-sky-300 hover:border-sky-300 outline-none`}
                value={value}
                onInput={(e: any) => onEdit(formatText(e.target.value))}
            />
            }
        </td>
    );
};