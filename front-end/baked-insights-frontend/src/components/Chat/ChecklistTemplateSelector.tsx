import { useEffect, useState } from 'react';
import Select, { MultiValue } from "react-select";
import { ChecklistTemplateService } from '../../services/checklistTemplateService';
import { APIChecklistTemplate } from '../../types/checklist';

// Interface for the component props
interface ChecklistTemplateSelectorProps {
  selectedTemplates: MultiValue<{
    value: number;
    label: string;
  }> | null;
  onChange: (selected: MultiValue<{
    value: number;
    label: string;
  }> | null) => void;
}

export const ChecklistTemplateSelector: React.FC<ChecklistTemplateSelectorProps> = ({ 
  selectedTemplates, 
  onChange 
}) => {
  const [templates, setTemplates] = useState<APIChecklistTemplate[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Fetch available checklist templates when component mounts
    const fetchTemplates = async () => {
      try {
        setIsLoading(true);
        const templatesData = await ChecklistTemplateService.getAllTemplates();
        if (!("message" in templatesData)) {
            setTemplates(templatesData);
        }
      } catch (error) {
        console.error('Error fetching checklist templates:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTemplates();
  }, []);

  // Convert templates to options format for react-select
  const templateOptions = templates.map((template) => ({
    value: template.id,
    label: `${template.title}`,
    // label: `${template.title}${template.has_checklists ? ' (has instances)' : ' (no instances)'}`,
  }));

  return (
    <div className="w-full">
      <Select
        value={selectedTemplates}
        onChange={onChange}
        options={templateOptions}
        isMulti
        isLoading={isLoading}
        placeholder="Filter by checklist templates..."
        noOptionsMessage={() => "No checklist templates available"}
        classNamePrefix="template-select"
        className="w-full"
        closeMenuOnSelect={false}
      />
    </div>
  );
};