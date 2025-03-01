import { useEffect, useState } from 'react';
import { useUsers } from '../../hooks/useUsers';
import { useTableShares } from '../../hooks/useTables';
import Select, { MultiValue } from "react-select";
import { MdPeopleAlt } from "react-icons/md";
import Popup from 'reactjs-popup';


interface ShareTableProps {
    tableID: number,
};


export const ShareTable: React.FC<ShareTableProps> = ({ tableID }) => {
    const [selectedOptions, setSelectedOptions] = useState<MultiValue<{
        value: number;
        label: string;
    }> | null>(null);

    // TODO: Exclude self from this list of options
    const { allUsers } = useUsers();
    const selectOptions = allUsers?.map((u) => ({value: u.id, label: u.username}));

    const {
        // Queries
        tableShares,
        isLoadingTableShares,
    
        // Mutations
        updateTableShares,
    } = useTableShares(tableID);

    useEffect(() => {
        if (!isLoadingTableShares && tableShares) {
            let selected = [];
            for (var i=0; i < tableShares.length; i++) {
                const share = tableShares[i];
                const user = selectOptions?.find(u => u.value === share.user_id);
                if (user) {
                    selected.push(user);
                }
            }
            setSelectedOptions(selected);
        }
    }, [tableShares, isLoadingTableShares]);

    const onSave = () => {
        const shareWith = selectedOptions?.map((item) => item.value).sort();
        const prevShareWith = tableShares?.map(s => s.user_id).sort();
        if (shareWith && prevShareWith && (shareWith.join(",") != prevShareWith.join(","))) {
            updateTableShares(shareWith)
        }
    };

    const shareButton = (
        <button className="items-center flex flex-row border font-medium text-sm px-3 py-1.5 rounded-lg text-gray-500 border-gray-300 bg-white hover:border-blue-200 hover:text-blue-500 hover:bg-sky-100">
            <span className="text-lg"><MdPeopleAlt /></span> &nbsp; Share
        </button>
    );

    return (
        <Popup
            trigger={shareButton}
            on={['hover']}
            position="bottom right"
            onClose={onSave}
            arrow={true}
            closeOnDocumentClick
        >
            <div className="bg-white p-4 drop-shadow-lg rounded-lg flex flex-col w-96">
                <div className="mb-4">
                    <label className="block text-gray-400 text-xs font-bold mb-2">Share With</label>
                    <Select
                        value={selectedOptions}
                        onChange={setSelectedOptions}
                        closeMenuOnSelect={false}
                        isClearable={false}
                        isMulti
                        options={selectOptions}
                    />
                </div>
            </div>
        </Popup>

    );
}