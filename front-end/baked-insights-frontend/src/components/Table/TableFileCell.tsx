import { Fragment, useRef } from 'react';
import { IoMdClose, IoMdDownload } from "react-icons/io";

interface TableFileCellProps {
    value: HTMLInputElement | string,
    onEdit: (e: any) => void,
    edited: boolean,
    type?: string,
    caseSensitive?: boolean,
};

const DEMARKATION = ":BAKEDINSIGHTS-DEMARKATION-PRESIGNED-URL:"

export const TableFileCell: React.FC<TableFileCellProps> = ({ value, onEdit, edited }) => {
    let inputRef = useRef<HTMLInputElement>(value instanceof HTMLInputElement ? value : null);

    const formatFileName = (fname: string) => {
        if (fname.length > 12) {
            return fname.slice(0, 6).concat("...").concat(fname.slice(-6))
        }
        return fname
    };

    return (
        <td className="min-w-40">
            <div className="flex flex-row items-center">
                {(typeof value == "string" && value.length > 0)
                    ? <Fragment>
                        <a
                            href={value.split(DEMARKATION)[1]}
                            className="text-lg hover:text-sky-600 flex flex-row items-center ml-auto"
                        >
                            <IoMdDownload/> <span className="text-sm pl-1">{formatFileName(value.split(DEMARKATION)[0])}</span>
                        </a>
                        <button
                            className="text-lg hover:text-red-600 pl-1 flex flex-row items-center font-bold ml-1 mr-auto"
                            onClick={() => onEdit("")}
                        >
                            <IoMdClose/>
                        </button>
                    </Fragment>
                    : <input
                        className={`${edited ? `text-sky-700 bg-sky-100 font-medium` : `bg-white`} w-full h-7 px-2 text-sm rounded-md border border-white focus:border-sky-300 hover:border-sky-300 outline-none`}
                        type="file"
                        ref={inputRef}
                        onInput={(e: any) => onEdit(e.target.files[0])}
                    />
                }
            </div>
        </td>
    );
};