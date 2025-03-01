import { Fragment } from 'react';
import { TableHeaderCell } from './TableHeaderCell';
import type { TableCell } from '../../types/index';
import { makeTableCell } from '../../utils/tableUtils';
import ColumnResizer from './ColumnResizer';

interface TableHeadersProps {
    headers: TableCell[],
    newColumnEnabled: boolean,
    onSaveHandler: (colIndex: number, filedName: string, fieldType: string) => void,
    onDeleteHandler: (colIndex: number) => void,
};

export const TableHeaders: React.FC<TableHeadersProps> = ({ headers, newColumnEnabled, onDeleteHandler, onSaveHandler }) => {

    const makeHeader = (header: TableCell, colIndex: number) => (
        header.dataType !== "primary-key" && (
            <Fragment key={colIndex}>
            <TableHeaderCell
                header={header}
                colIndex={colIndex}
                onSave={onSaveHandler}
                onDelete={onDeleteHandler}
                isControlCell={false}
            />
            <ColumnResizer
                className="bg-white border-l border-gray-50"
                minWidth={0}
                maxWidth={null}
                id={colIndex}
                disabled={false}
                resizeEnd={() => null}
                resizeStart={() => null}
            />
            </Fragment>
        )
    );

    const newFieldHeader = makeTableCell("-", "+", true, true);

    return (
        <>
        <tr>
            <th className="px-2 py-4 sticky left-0 bg-white drop-shadow-[1.4px_0px_0.1px_rgba(0,0,0,0.1)]" />
            {headers.map(makeHeader)}
            {newColumnEnabled && 
                <TableHeaderCell
                    header={newFieldHeader}
                    colIndex={headers.length}
                    onSave={onSaveHandler}
                    onDelete={onDeleteHandler}
                    isControlCell={true}
                />
            }
            {headers.length > 0 &&
                <th className="px-2 py-1 text-center sticky right-0 min-w-24 bg-white drop-shadow-[-1.4px_0px_0.1px_rgba(0,0,0,0.1)]">
                </th>
            }
        </tr>
        </>
    );
};