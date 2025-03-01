const FormattedMessage = ({ content }: { content: string }) => {
  const formatContent = (text: string) => {
    // Split content into sections first (if there are section headers)
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