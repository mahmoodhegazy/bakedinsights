import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { IoIosArrowBack, IoMdAttach } from "react-icons/io";
import { useTablesManager } from '../../hooks/useTables';
import Papa from 'papaparse';

export const TableUploadCSV = () => {

    const navigate = useNavigate();
    const [title, setTitle] = useState<string>("New Table");
    const [uploading, setUploading] = useState<boolean>(false);
    const [progress, setProgress] = useState<string>("");

    const { importCSVChunked } = useTablesManager();

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) {
            return;
        }

        setUploading(true);
        setProgress("Parsing CSV file...");

        // Parse CSV client-side for speed
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                if (!results.data || results.data.length === 0) {
                    alert("CSV file is empty or invalid");
                    setUploading(false);
                    return;
                }

                const headers = results.meta.fields || [];
                const rows = results.data as any[];

                // Infer column types and clean data
                const columns = headers.map((header: string) => {
                    let dataType = 'text';
                    const firstValue = rows[0]?.[header];
                    
                    if (firstValue !== undefined && firstValue !== null && firstValue !== '') {
                        const cleaned = String(firstValue).replace(/,/g, '').replace(/\s/g, '').trim();
                        if (!isNaN(parseFloat(cleaned)) && isFinite(parseFloat(cleaned))) {
                            dataType = 'number';
                        }
                    }
                    
                    return {
                        name: header,
                        data_type: dataType
                    };
                });

                // Convert rows to array format and clean numbers
                const data = rows.map(row => {
                    return headers.map((header, idx) => {
                        let value = row[header] ?? '';
                        
                        // Clean number values (but preserve 0 and other falsy values)
                        if (columns[idx].data_type === 'number' && value !== '' && value !== null && value !== undefined) {
                            value = String(value).replace(/,/g, '').replace(/\s/g, '').trim();
                        }
                        
                        return value;
                    });
                });

                setProgress(`Uploading ${data.length} rows...`);

                // Upload with chunking
                importCSVChunked({
                    name: title || file.name.replace('.csv', ''),
                    columns: columns,
                    data: data,
                    onProgress: (current, total) => {
                        setProgress(`Uploading chunk ${current} of ${total}...`);
                    }
                }, {
                    onSuccess: () => {
                        setUploading(false);
                        navigate(`/tables`);
                    },
                    onError: (error: Error) => {
                        setUploading(false);
                        alert(`Error uploading CSV: ${error.message}`);
                    }
                });
            },
            error: (error) => {
                setUploading(false);
                alert(`Error parsing CSV: ${error.message}`);
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
                    <p className="pl-1 mb-4 mt-2 text-sm italic">File will be parsed client-side and uploaded in chunks for faster processing.</p>
                    {uploading ? (
                        <div className="pl-1 text-sm text-blue-600 font-medium">
                            {progress}
                        </div>
                    ) : (
                        <input
                            type="file"
                            accept=".csv"
                            onChange={handleFileUpload}
                            className="pl-1 text-sm"
                        />
                    )}
                </span>
            </span>
        </div>
        </div>


        </>
    );
}