import React, { useState, useRef, useEffect } from 'react';
import { IoMdClose } from "react-icons/io";
import Select from 'react-select';
import { AIService, ChatMessage } from '../../services/aiService';
import { toast } from 'react-toastify';
import FormattedMessage from './FormattedMessage';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/axios';
import { formatDate } from '../../utils/dateUtils';
import { APIChecklist, APIChecklistField, APIChecklistItem, APIChecklistTemplate } from '../../types/checklist';

// Interface for table data
interface TableData {
  header: {
    column_id: number;
    column_name: string;
    column_data_type: string;
  };
  data: {
    record_id: number;
    value: any;
    data_id: number;
  }[];
}

// Interface for selection options for SKU/LOT
interface SelectOption {
  value: string;
  label: string;
}

// Interface for the formatted checklist item
interface FormattedChecklistItem {
  id: number;
  field_id: number;
  field_name?: string;
  field_type?: string;
  order: number;
  value: any;
  comment: string;
  completed: string;
  completed_at: string;
}

// Interface for the formatted checklist
interface FormattedChecklist {
  id: number;
  name: string;
  created_by: string;
  created_at: string;
  status: string;
  completion: string;
  items: FormattedChecklistItem[];
}

interface ChatWindowProps {
  isOpen: boolean; // Controls visibility of the chat window
  onClose: () => void; // Function to close the chat window
}

const ChatWindow: React.FC<ChatWindowProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]); // Array of chat messages, where each message has a role ('user' or 'assistant') and content
  const [input, setInput] = useState(''); // Input text for the user to send messages
  const [isLoading, setIsLoading] = useState(false); // Loading state for when the AI is processing a response
  const [selectedSKU, setSelectedSKU] = useState<SelectOption | null>(null);
  const [selectedLotNumber, setSelectedLotNumber] = useState<SelectOption | null>(null); // New state for lot number
  const [selectedDate, setSelectedDate] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null); // Reference to the last message element to scroll to handle auto-scrolling

  // Query to fetch all checklist templates (to get fields data)
  const { data: checklistTemplates } = useQuery<APIChecklistTemplate[]>({
    queryKey: ['checklistTemplates'],
    queryFn: async () => {
      try {
        const response = await api.get('/checklists/templates');
        return response.data;
      } catch (error) {
        console.error("Error fetching checklist templates:", error);
        return [];
      }
    }
  });

  // Query to fetch all user checklists
  const { data: userChecklists } = useQuery<APIChecklist[]>({
    queryKey: ['userChecklists'],
    queryFn: async () => {
      try {
        const response = await api.get('/checklists/');
        return response.data;
      } catch (error) {
        console.error("Error fetching user checklists:", error);
        return [];
      }
    }
  });

  // Fetch all checklist details (with items)
  const { data: checklistDetails } = useQuery<
    { checklist: APIChecklist; items: APIChecklistItem[]; templateFields: APIChecklistField[] }[]
  >({
    queryKey: ['allChecklistDetails', userChecklists],
    queryFn: async () => {
      if (!userChecklists || !checklistTemplates) return [];

      // For each checklist, fetch its items and relevant template fields
      const details = await Promise.all(
        userChecklists.map(async (checklist) => {
          try {
            // Get checklist items
            const itemsResponse = await api.get(`/checklists/${checklist.id}`);
            const items = itemsResponse.data;

            // Find corresponding template
            const template = checklistTemplates.find(t => t.id === checklist.template_id);
            const templateFields = template?.fields || [];

            return {
              checklist,
              items,
              templateFields
            };
          } catch (error) {
            console.error(`Error fetching details for checklist ${checklist.id}:`, error);
            return {
              checklist,
              items: [],
              templateFields: []
            };
          }
        })
      );

      return details;
    },
    enabled: !!(userChecklists && checklistTemplates)
  });

  // Collect all unique SKUs from both tables and checklists
  const { data: skuOptions } = useQuery<SelectOption[]>({
    queryKey: ['skuOptions'],
    queryFn: async () => {
      // Fetching SKU options directly from database tables and checklist items
      const skuSet = new Set<string>();

      // 1. Get SKUs from tables
      try {
        const tablesResponse = await api.get('/tables/assigned');
        const tables = tablesResponse.data.tables;

        const tableDataPromises = tables.map((table: { id: number }) => 
          api.get(`/tables/${table.id}`)
        );
        
        const tableResponses = await Promise.all(tableDataPromises);
        
        // Extract SKUs from tables
        tableResponses.forEach(response => {
          const table = response.data.table;
          table.tabs?.forEach((tab: any) => {
            tab.data.forEach((column: TableData) => {
              if (column.header.column_data_type === 'sku') {
                column.data.forEach(item => {
                  if (item.value) {
                    // console.log(`Found table SKU: ${item.value}`);
                    skuSet.add(item.value);
                  }
                });
              }
            });
          });
        });
      } catch (error) {
        console.error("Error getting SKUs from tables:", error);
      }

      // 2. Get SKUs directly from all checklists
      try {
        // Get all checklists
        const checklistsResponse = await api.get('/checklists/');
        const checklists = checklistsResponse.data;
        
        // For each checklist, get all its items
        for (const checklist of checklists) {
          try {
            const itemsResponse = await api.get(`/checklists/${checklist.id}`);
            const items = itemsResponse.data;
            
            // Use array reduce to filter and extract SKU items in one pass
            items.reduce((set: { add: (arg0: any) => void; }, item: { data_type: string; value: any; }) => {
              if (item.data_type === 'sku' && item.value && typeof item.value === 'string') {
                set.add(item.value);
              }
              return set;
            }, skuSet);

          } catch (err) {
            console.error(`Error fetching items for checklist ${checklist.id}:`, err);
          }
        }
      } catch (error) {
        console.error("Error getting SKUs from checklists:", error);
      }

      const skuArray = Array.from(skuSet);
      console.log(`Found ${skuArray.length} unique SKUs:`, skuArray);
      
      return skuArray.map(sku => ({
        value: sku,
        label: sku
      }));
    }
  });

  // Collect all unique lot numbers from both tables and checklists
  const { data: lotNumberOptions } = useQuery<SelectOption[]>({
    queryKey: ['lotNumberOptions'],
    queryFn: async () => {
      const lotNumberSet = new Set<string>();

      // 1. Get lot numbers from tables
      try {
        const tablesResponse = await api.get('/tables/assigned');
        const tables = tablesResponse.data.tables;

        const tableDataPromises = tables.map((table: { id: number }) => 
          api.get(`/tables/${table.id}`)
        );
        
        const tableResponses = await Promise.all(tableDataPromises);
        
        // Extract lot numbers from tables
        tableResponses.forEach(response => {
          const table = response.data.table;
          table.tabs?.forEach((tab: any) => {
            tab.data.forEach((column: TableData) => {
              if (column.header.column_data_type === 'lot-number') {
                column.data.forEach(item => {
                  if (item.value) {
                    lotNumberSet.add(item.value);
                  }
                });
              }
            });
          });
        });
      } catch (error) {
        console.error("Error getting lot numbers from tables:", error);
      }

      // 2. Get lot numbers from checklists
      if (checklistDetails) {
        checklistDetails.forEach(({ items, templateFields }) => {
          items.forEach(item => {
            const field = templateFields.find(f => f.id === item.field_id);
            if (field?.data_type === 'lot-number' && item.value) {
              lotNumberSet.add(item.value);
            }
          });
        });
      }
      
      return Array.from(lotNumberSet).map(lotNumber => ({
        value: lotNumber,
        label: lotNumber
      }));
    }
  });

  // Filter checklist data based on selected SKU and date
  const filteredChecklistData = React.useMemo(() => {
    if (!checklistDetails) return [];

    return checklistDetails
      .filter(({ checklist, items, templateFields }) => {
        // Date filter
        if (selectedDate) {
          const checklistDate = new Date(checklist.created_at).toISOString().split('T')[0];
          if (checklistDate !== selectedDate) return false;
        }

        // SKU filter
        if (selectedSKU) {
          // Check if any item has the selected SKU
          const hasSku = items.some(item => {
            // Direct check for SKU in the value
            return item.value === selectedSKU.value;
          });
          
          if (!hasSku) return false;
        }

        // Lot Number filter
        if (selectedLotNumber) {
          const hasLotNumber = items.some(item => {
            const field = templateFields.find(f => f.id === item.field_id);
            return field?.data_type === 'lot-number' && item.value === selectedLotNumber.value;
          });
          
          if (!hasLotNumber) return false;
        }


        return true;
      })
      .map(({ checklist, items, templateFields }) => {
        // Format the data for display
        const formattedChecklist: FormattedChecklist = {
          id: checklist.id,
          name: checklist.template_name,
          created_by: checklist.created_by_username,
          created_at: formatDate(checklist.created_at),
          status: checklist.submitted ? 'Submitted' : 'Not Submitted',
          completion: `${checklist.num_completed}/${checklist.num_tasks} tasks completed`,
          items: items.map(item => {
            // Find the field for this item
            const field = templateFields.find(f => f.id === item.field_id);
            
            return {
              id: item.id,
              field_id: item.field_id,
              field_name: field?.name || 'Unknown Field',
              field_type: field?.data_type || 'unknown',
              order: item.order,
              value: item.value,
              comment: item.comment || '',
              completed: item.completed_at ? 'Yes' : 'No',
              completed_at: item.completed_at ? formatDate(item.completed_at) : 'Not completed'
            };
          })
        };

        return formattedChecklist;
      });
  }, [checklistDetails, selectedSKU, selectedLotNumber, selectedDate]);

  // Query to fetch context data based on SKU, lot number, and date selection
  const { data: tableContextData } = useQuery({
    queryKey: ['tableContextData', selectedSKU?.value, selectedLotNumber?.value, selectedDate],
    queryFn: async () => {
      if (!selectedSKU && !selectedLotNumber && !selectedDate) return null;

      const response = await api.get('/tables/assigned');
      const tables = response.data.tables;
      
      const tableDataPromises = tables.map((table: { id: any; }) => 
        api.get(`/tables/${table.id}`)
      );
      const tableResponses = await Promise.all(tableDataPromises);
      
      const contextData: any = {};
      tableResponses.forEach(response => {
        const table = response.data.table;
        table.tabs?.forEach((tab: any) => {
          const tabData: any = {};
          let hasMatch = false;
          
          let matchingRecordIds = new Set<number>();
          
          // Filter by SKU
          if (selectedSKU) {
            const skuColumn = tab.data.find((col: TableData) => 
              col.header.column_data_type === 'sku'
            );
            
            if (skuColumn) {
              skuColumn.data
                .filter((item: { value: string; }) => item.value === selectedSKU.value)
                .forEach((item: { record_id: number; }) => matchingRecordIds.add(item.record_id));
            }
          }
          // Filter by Lot Number
          if (selectedLotNumber) {
            const lotNumberColumn = tab.data.find((col: TableData) => 
              col.header.column_data_type === 'lot-number'
            );
            
            if (lotNumberColumn) {
              const lotNumberRecords = new Set<number>();
              
              lotNumberColumn.data
                .filter((item: { value: string; }) => item.value === selectedLotNumber.value)
                .forEach((item: { record_id: number; }) => lotNumberRecords.add(item.record_id));
              
              // If SKU is also selected, we need the intersection
              if (matchingRecordIds.size > 0) {
                const intersection = new Set<number>();
                lotNumberRecords.forEach(recordId => {
                  if (matchingRecordIds.has(recordId)) {
                    intersection.add(recordId);
                  }
                });
                matchingRecordIds = intersection;
              } else {
                matchingRecordIds = lotNumberRecords;
              }
            }
          }
          
          // Filter by Date  
          if (selectedDate) {
            const dateColumn = tab.data.find((col: TableData) => 
              col.header.column_data_type === 'date'
            );

            if (dateColumn) {
              const dateRecords = new Set<number>();
              
              dateColumn.data
                .filter((item: { value: string; }) => {
                  const itemDate = new Date(item.value).toISOString().split('T')[0];
                  return itemDate === selectedDate;
                })
                .forEach((item: { record_id: number; }) => dateRecords.add(item.record_id));
              
              // If SKU or lot number is also selected, we need the intersection
              if (matchingRecordIds.size > 0) {
                const intersection = new Set<number>();
                dateRecords.forEach(recordId => {
                  if (matchingRecordIds.has(recordId)) {
                    intersection.add(recordId);
                  }
                });
                matchingRecordIds = intersection;
              } else {
                matchingRecordIds = dateRecords;
              }
            }
            
            // if (dateColumn) {
            //   const dateRecords = dateColumn.data
            //     .filter((item: { value: string; }) => {
            //       const itemDate = new Date(item.value).toISOString().split('T')[0];
            //       return itemDate === selectedDate;
            //     })
            //     .map((item: { record_id: number; }) => item.record_id);
              
            //   if (selectedSKU) {
            //     dateRecords.forEach((recordId: number) => {
            //       if (matchingRecordIds.has(recordId)) {
            //         matchingRecordIds.add(recordId);
            //       }
            //     });
            //   } else {
            //     dateRecords.forEach((recordId: number) => matchingRecordIds.add(recordId));
            //   }
            // }
          }
          
          if (matchingRecordIds.size > 0) {
            tab.data.forEach((column: TableData) => {
              const columnData = column.data
                .filter(item => matchingRecordIds.has(item.record_id))
                .map(item => item.value);
              
              if (columnData.length > 0) {
                tabData[column.header.column_name] = columnData;
                hasMatch = true;
              }
            });
            
            if (hasMatch) {
              contextData[`${table.name} - ${tab.name}`] = tabData;
            }
          }
        });
      });
      
      return contextData;
    },
    enabled: !!(selectedSKU || selectedLotNumber || selectedDate)
  });

  // Prepare combined context data from both tables and checklists
  const contextData = React.useMemo(() => {
    return { 
      tables: tableContextData || {},
      checklists: filteredChecklistData || []
    };
  }, [tableContextData, filteredChecklistData]);

  // Scroll handling
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Message handling
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const contextMessages: ChatMessage[] = [...messages];
      
      // Add context message if we have context data
      if (contextData && (Object.keys(contextData.tables).length > 0 || contextData.checklists.length > 0)) {
        const contextInfo = [];
        if (selectedSKU) contextInfo.push(`SKU ${selectedSKU.value}`);
        if (selectedLotNumber) contextInfo.push(`Lot Number ${selectedLotNumber.value}`);
        if (selectedDate) contextInfo.push(`date ${selectedDate}`);
        
        const contextMessage: ChatMessage = {
          role: 'system',
          content: `Current context - Data for ${contextInfo.join(' and ')}:\n${JSON.stringify(contextData, null, 2)}`
        };
        contextMessages.push(contextMessage);
      }
      
      const response = await AIService.getChatResponse([...contextMessages, userMessage]);
      const aiMessage: ChatMessage = { role: 'assistant', content: response };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error getting AI response:', error);
      toast.error('Failed to get AI response. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Initial welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage: ChatMessage = {
        role: 'assistant',
        content: `Welcome to Baked Insights!\n\nI'm your AI assistant, and I can help you analyze production data and answer questions about:\n\n* Specific SKUs and dates in your production records and checklists\n* Production trends and patterns\n* Quality metrics and compliance\n* Historical data analysis\n\nSelect a SKU and/or date above to get specific information, or ask me any general questions about the system.`
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen]);

  // Current context summary for display
  const contextSummary = React.useMemo(() => {
    if (!contextData) return null;
    
    const tableCount = Object.keys(contextData.tables).length;
    const checklistCount = contextData.checklists.length;
    
    if (tableCount === 0 && checklistCount === 0) return null;
    
    const contextFilters = [];
    if (selectedSKU) contextFilters.push(`SKU: ${selectedSKU.value}`);
    if (selectedLotNumber) contextFilters.push(`Lot#: ${selectedLotNumber.value}`);
    if (selectedDate) contextFilters.push(`Date: ${selectedDate}`);
    
    const filterText = contextFilters.length > 0 
      ? `Filters: ${contextFilters.join(', ')} | ` 
      : '';
    
    return (
      <div className="text-xs text-gray-500 mt-1">
        {filterText}Using: {tableCount > 0 ? `${tableCount} tables` : ''} 
        {tableCount > 0 && checklistCount > 0 ? ' and ' : ''}
        {checklistCount > 0 ? `${checklistCount} checklists` : ''}
      </div>
    );
  }, [contextData, selectedSKU, selectedLotNumber, selectedDate]);

  if (!isOpen) return null;

  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-lg flex flex-col z-50">
      {/* Header with filters */}
      <div className="flex flex-col p-4 border-b border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">AI Assistant</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <IoMdClose className="w-6 h-6" />
          </button>
        </div>
        <div className="space-y-2">
          <Select
            value={selectedSKU}
            onChange={(option) => setSelectedSKU(option)}
            options={skuOptions}
            placeholder="Select a SKU for context..."
            isClearable
            className="w-full mb-2"
          />
          
          <Select
            value={selectedLotNumber}
            onChange={(option) => setSelectedLotNumber(option)}
            options={lotNumberOptions}
            placeholder="Select a Lot Number..."
            isClearable
            className="w-full mb-2"
          />
          
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {contextSummary}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                message.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100'
              }`}
            >
              {message.role === 'user' ? (
                message.content
              ) : (
                <FormattedMessage content={message.content} />
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="border-t border-gray-200 p-4">
        <div className="flex space-x-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatWindow;