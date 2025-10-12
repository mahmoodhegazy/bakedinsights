import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { IoIosArrowBack, IoMdAttach } from "react-icons/io";
import { useTablesManager } from '../../hooks/useTables';

export const TableUploadCSV = () => {

    const navigate = useNavigate();
    const [title, setTitle] = useState<string>("New Table");

    const { importCSV } = useTablesManager();

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) {
            return;
        }

        // Upload raw file to server for parsing
        importCSV({
            file: file,
            name: title || file.name.replace('.csv', '')
        }, {
            onSuccess: () => {
                navigate(`/tables`);
            }
        });
    };

    return (
        <>
        {/* Table Control */}
        <div className="flex items-center flex-wrap flex-row space-y-0 pb-4">
            <button
                className="mr-auto items-center flex flex-row font-bold text-sm py-1.5 rounded-lg text-gray-500 bg-white hover:text-gray-700"
                onClick={() => {navigate("/tables")}}
            >
                <IoIosArrowBack /> Back
            </button>
        </div>
        <input
            className="w-full text-left outline-none font-bold rounded-lg border border-white hover:border-sky-300 focus:border-sky-300 text-slate-500 p-1 mb-2"
            type="text"
            value={title}
            placeholder="Untitled"
            onInput={(e: any) => {setTitle(e.target.value)}}
        />

        <div className="px-8 py-4 border-t border-gray-300 w-full mb-4 overflow-auto">
        <div className="container text-slate-600 w-auto mx-auto border border-dashed border-gray p-4 mb-4">
            <span className="flex flex-row text-slate-400 font-medium">
                <IoMdAttach className="text-2xl"/> 
                <span className="flex flex-col">
                    <h4 className="pl-1 uppercase text-sm font-bold">Attach CSV</h4>
                    <p className="pl-1 mb-4 mt-2 text-sm italic">File will be parsed and converted to a table.</p>
                    <input
                        type="file"
                        accept=".csv"
                        onChange={handleFileUpload}
                        className="pl-1 text-sm"
                    />
                </span>
            </span>
        </div>
        </div>


        </>
    );
}