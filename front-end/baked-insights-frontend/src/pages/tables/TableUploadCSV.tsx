import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { IoIosArrowBack, IoMdAttach } from "react-icons/io";
import CSVReader from 'react-csv-reader';
import { useTablesManager } from '../../hooks/useTables';

export const TableUploadCSV = () => {

    const navigate = useNavigate();
    const [title, setTitle] = useState<string>("New Table");

    const { createTableFromData } = useTablesManager();


    const parseCSV = (data: any[]) => {
        if (data.length == 0) {
            return;
        }

        const dataHeaders = [];
        const dataValues = [];

        // -- make headers (iterate through columns)
        for (const columnName in data[0]) {
            const dataType = typeof(data[0][columnName]);
            var columnDataType;
            if (["string", "symbol", "undefined", "object", "function"].includes(dataType)) {
                columnDataType = "text";
            } else if (columnDataType == "bigint") {
                columnDataType = "number";
            } else {
                columnDataType = dataType;
            }
            dataHeaders.push({name: columnName, data_type: columnDataType});
        }

        // -- iterate through rows
        for (var rowIndex = 0; rowIndex < data.length; rowIndex++) {
            const newRow = [];
            // -- iterate through columns
            for (const columnName in data[rowIndex]) {
                let val = data[rowIndex][columnName];
                if (val == undefined) {
                    val = "";
                }
                newRow.push(val);
            }
            dataValues.push(newRow);
        }

        createTableFromData({
            name: title,
            columns: dataHeaders,
            data: dataValues
        }, {onSuccess : () => {navigate(`/tables`)}});
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
                    <CSVReader
                        cssClass="react-csv-input"
                        onFileLoaded={(data) => parseCSV(data)}
                        parserOptions={{
                            header: true,
                            dynamicTyping: true,
                            skipEmptyLines: true,
                        }}
                    />
                </span>
            </span>
        </div>
        </div>


        </>
    );
}