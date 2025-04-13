import { useEffect, useState } from 'react';
import Select, { MultiValue } from "react-select";
import api from '../../api/axios';

// Interface for the component props
interface TableSelectorProps {
  selectedTables: MultiValue<{
    value: number;
    label: string;
  }> | null;
  onChange: (selected: MultiValue<{
    value: number;
    label: string;
  }> | null) => void;
}

// Interface for table data from API
interface TableInfo {
  id: number;
  name: string;
}

export const TableSelector: React.FC<TableSelectorProps> = ({ 
  selectedTables, 
  onChange 
}) => {
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Fetch available tables when component mounts
    const fetchTables = async () => {
      try {
        setIsLoading(true);
        const response = await api.get('/tables/assigned');
        setTables(response.data.tables);
      } catch (error) {
        console.error('Error fetching tables:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTables();
  }, []);

  // Convert tables to options format for react-select
  const tableOptions = tables.map((table) => ({
    value: table.id,
    label: table.name,
  }));

  return (
    <div className="w-full">
      <Select
        value={selectedTables}
        onChange={onChange}
        options={tableOptions}
        isMulti
        isLoading={isLoading}
        placeholder="Filter by tables..."
        noOptionsMessage={() => "No tables available"}
        classNamePrefix="table-select"
        className="w-full"
        closeMenuOnSelect={false}
      />
    </div>
  );
};