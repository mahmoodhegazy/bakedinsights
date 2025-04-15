import React from 'react';

interface FormattedMessageProps {
  content: string;
}

const FormattedMessage: React.FC<FormattedMessageProps> = ({ content }) => {
  // Try to parse the content as JSON
  const tryParseJSON = (text: string) => {
    // Strip away any markdown code block markers
    let cleanText = text.trim();
    
    // Check if the text is wrapped in a code block
    const codeBlockMatch = cleanText.match(/^```(?:json)?\s*([\s\S]*?)```\s*$/);
    if (codeBlockMatch) {
      cleanText = codeBlockMatch[1].trim();
    }
    
    if (cleanText.startsWith('{') && cleanText.endsWith('}')) {
      try {
        return JSON.parse(cleanText);
      } catch (e) {
        console.log('Content appears to be JSON but failed to parse, treating as text');
        return null;
      }
    }
    return null;
  };

  // Format structured JSON data
  const formatStructuredData = (data: any) => {
    // Format tables section
    const renderTables = () => {
      if (!data.tables || Object.keys(data.tables).length === 0) {
        return null;
      }

      return (
        <div className="mb-4">
          <h3 className="font-bold text-gray-800 mb-2">Production Records</h3>
          {Object.entries(data.tables).map(([tableName, tableData]: [string, any], index) => (
            <div key={index} className="mb-3 bg-gray-50 p-3 rounded-lg">
              <h4 className="font-semibold text-gray-700">{tableName}</h4>
              <div className="pl-4">
                {Object.entries(tableData).map(([field, values]: [string, any], idx) => (
                  <div key={idx} className="mb-1">
                    <span className="font-medium">{field}:</span>{' '}
                    {Array.isArray(values) 
                      ? values.map((v, i) => <span key={i}>{v}{i < values.length - 1 ? ', ' : ''}</span>)
                      : values}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      );
    };

    // Format checklists section
    const renderChecklists = () => {
      if (!data.checklists || data.checklists.length === 0) {
        return null;
      }

      return (
        <div className="mb-4">
          <h3 className="font-bold text-gray-800 mb-2">Checklists</h3>
          {data.checklists.map((checklist: any, index: number) => (
            <div key={index} className="mb-3 bg-gray-50 p-3 rounded-lg">
              <h4 className="font-semibold text-gray-700">{checklist.name}</h4>
              <div className="pl-4">
                <div className="text-sm"><span className="font-medium">Created by:</span> {checklist.created_by}</div>
                <div className="text-sm"><span className="font-medium">Date:</span> {checklist.created_at}</div>
                <div className="text-sm"><span className="font-medium">Status:</span> <span className={checklist.status === 'Submitted' ? 'text-green-600' : 'text-amber-600'}>{checklist.status}</span></div>
                <div className="text-sm"><span className="font-medium">Completion:</span> {checklist.completion}</div>
                
                {checklist.items && checklist.items.length > 0 && (
                  <div className="mt-2">
                    <div className="font-medium text-sm">Items:</div>
                    <ul className="list-disc pl-6">
                      {checklist.items.map((item: any, idx: number) => (
                        <li key={idx} className="text-sm">
                          {item.field_name}: <span className="font-medium">{item.value}</span> 
                          {item.comment && <span className="text-gray-600 italic"> (Comment: {item.comment})</span>}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      );
    };

    // Format attached files section
    const renderFiles = () => {
      if (!data.files_attached || Object.keys(data.files_attached).length === 0) {
        return null;
      }

      return (
        <div className="mb-4">
          <h3 className="font-bold text-gray-800 mb-2">Attached Files</h3>
          {Object.entries(data.files_attached).map(([fileName, fileContent]: [string, any], index) => (
            <div key={index} className="mb-3 bg-gray-50 p-3 rounded-lg">
              <h4 className="font-semibold text-gray-700">{fileName}</h4>
              <div className="pl-4 max-h-40 overflow-y-auto bg-gray-100 p-2 rounded text-xs">
                <pre className="whitespace-pre-wrap">{fileContent}</pre>
              </div>
            </div>
          ))}
        </div>
      );
    };

    // Render summary and analysis
    return (
      <div className="space-y-4">
        {data.summary && (
          <div className="text-gray-700 mb-4">
            {data.summary}
          </div>
        )}
        
        {renderTables()}
        {renderChecklists()}
        {renderFiles()}
        
        {data.analysis && (
          <div className="mt-4">
            <h3 className="font-bold text-gray-800 mb-2">Analysis</h3>
            <div className="text-gray-700">
              {data.analysis}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Process regular text content (original code)
  const formatContent = (text: string) => {
    // First check if it's structured JSON data
    const jsonData = tryParseJSON(text);
    if (jsonData) {
      return formatStructuredData(jsonData);
    }

    // If not JSON, proceed with regular text formatting
    // Split content into sections (if there are section headers)
    const sections = text.split(/(?=### )/).filter(Boolean);

    if (sections.length === 1) {
      // If no section headers, process as a single section
      return processSection(text);
    }

    return sections.map((section, index) => {
      const sectionContent = section.replace(/^### /, '');
      const [title, ...content] = sectionContent.split('\n');

      return (
        <div key={index} className="mb-4 last:mb-0">
          <h3 className="font-bold text-gray-800 mb-2">{title}</h3>
          {processSection(content.join('\n'))}
        </div>
      );
    });
  };

  const processSection = (text: string) => {
    // Check for numbered list pattern (e.g., "1.", "2.", etc.)
    const hasNumberedList = /^\d+\.\s/m.test(text);
    
    if (hasNumberedList) {
      // Split by numbered items while preserving numbers
      const items = text.split(/(?=\d+\.\s)/).filter(Boolean);
      
      return (
        <ol className="list-decimal list-outside ml-6 space-y-2">
          {items.map((item, index) => {
            // Remove the number and dot from the start
            const content = item.replace(/^\d+\.\s+/, '');
            // Split into paragraphs
            const paragraphs = content.split('\n').filter(Boolean);
            
            return (
              <li key={index} className="text-gray-700">
                {paragraphs.map((paragraph, pIndex) => (
                  <p key={pIndex} className={pIndex > 0 ? 'mt-2' : ''}>
                    {formatInlineMarkdown(paragraph)}
                  </p>
                ))}
              </li>
            );
          })}
        </ol>
      );
    }

    // Check for bullet points
    const hasBullets = /^[\*\-]\s/m.test(text);

    if (hasBullets) {
      const items = text.split(/\n(?=[\*\-]\s)/).filter(Boolean);
      
      return (
        <ul className="list-disc list-outside ml-6 space-y-2">
          {items.map((item, index) => (
            <li key={index} className="text-gray-700">
              {formatInlineMarkdown(item.replace(/^[\*\-]\s+/, ''))}
            </li>
          ))}
        </ul>
      );
    }

    // If no lists detected, process as regular paragraphs
    return text.split('\n').filter(Boolean).map((paragraph, index) => (
      <p key={index} className="text-gray-700 mb-2 last:mb-0">
        {formatInlineMarkdown(paragraph)}
      </p>
    ));
  };

  const formatInlineMarkdown = (text: string) => {
    // Process bold text (** or __ surrounded)
    text = text.replace(/(\*\*|__)(.*?)\1/g, '<strong>$2</strong>');
    
    // Process italic text (* or _ surrounded)
    text = text.replace(/(\*|_)(.*?)\1/g, '<em>$2</em>');
    
    // Process inline code (` surrounded)
    text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    return (
      <span 
        dangerouslySetInnerHTML={{ __html: text }}
        className="[&>code]:bg-gray-100 [&>code]:px-1 [&>code]:py-0.5 [&>code]:rounded [&>code]:font-mono [&>code]:text-sm"
      />
    );
  };

  return (
    <div className="space-y-4">
      {formatContent(content)}
    </div>
  );
};

export default FormattedMessage;