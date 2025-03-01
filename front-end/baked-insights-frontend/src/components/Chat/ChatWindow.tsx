import React, { useState, useRef, useEffect } from 'react';
import { IoMdClose } from "react-icons/io";
import Select from 'react-select';
import { AIService, ChatMessage } from '../../services/aiService';
import { toast } from 'react-toastify';
import FormattedMessage from './FormattedMessage';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/axios';

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

// Interface for SKU data
interface SKUOption {
  value: string;
  label: string;
}

interface ChatWindowProps {
  isOpen: boolean; // Controls visibility of the chat window
  onClose: () => void; // Function to close the chat window
}

const ChatWindow: React.FC<ChatWindowProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]); // Array of chat messages, where each message has a role ('user' or 'assistant') and content
  const [input, setInput] = useState(''); // Input text for the user to send messages
  const [isLoading, setIsLoading] = useState(false); // Loading state for when the AI is processing a response
  const [selectedSKU, setSelectedSKU] = useState<SKUOption | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null); // Reference to the last message element to scroll to handle auto-scrolling

  // Query to fetch unique SKUs from the database
  const { data: skuData } = useQuery({
    queryKey: ['skuOptions'],
    queryFn: async () => {
      // First, find columns with data_type 'sku'
      const response = await api.get('/tables/assigned'); // Get all assigned tables
      const tables = response.data.tables; // Extract the tables from the response
      
      // Get detailed data for each table
      const tableDataPromises = tables.map((table: { id: any; }) => 
        api.get(`/tables/${table.id}`)
      );
      const tableResponses = await Promise.all(tableDataPromises);
      
      // Extract all SKU values from the tables
      const skuSet = new Set<string>(); // Use a Set to store unique SKUs
      tableResponses.forEach(response => {
        const table = response.data.table; // Extract the table data
        table.tabs?.forEach((tab: any) => { // Iterate over each tab in the table
          tab.data.forEach((column: TableData) => { // Iterate over each column in the tab
            if (column.header.column_data_type === 'sku') { // Check if the column is of type 'sku'
              column.data.forEach(item => {
                if (item.value) skuSet.add(item.value); // Add the SKU value to the Set
              });
            }
          });
        });
      });
      
      // Convert to options format
      return Array.from(skuSet).map(sku => ({
        value: sku,
        label: sku
      }));
    }
  });

  // Query to fetch context data based on SKU and date selection
  const { data: contextData } = useQuery({
    queryKey: ['contextData', selectedSKU?.value, selectedDate],
    queryFn: async () => {
      // If neither SKU nor date is selected, return null
      if (!selectedSKU && !selectedDate) return "There was no data returned for this selection. Tell that to the user.";

      const response = await api.get('/tables/assigned'); // Get all assigned tables
      const tables = response.data.tables; // Extract the tables from the response
      
      // Get detailed data for each table
      const tableDataPromises = tables.map((table: { id: any; }) => 
        api.get(`/tables/${table.id}`)
      );
      const tableResponses = await Promise.all(tableDataPromises);
      
      // Find all data related to the selected SKU and date
      const contextData: any = {};
      tableResponses.forEach(response => { // Iterate over each table
        const table = response.data.table;
        table.tabs?.forEach((tab: any) => {
          const tabData: any = {};
          let hasMatch = false;
          
          // Find matching record IDs based on SKU and date criteria
          const matchingRecordIds = new Set<number>();
          
          // First, find records matching SKU if selected
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
          
          // Then, find records matching date if selected
          if (selectedDate) {
            const dateColumn = tab.data.find((col: TableData) => 
              col.header.column_data_type === 'date'
            );
            
            if (dateColumn) {
              const dateRecords = dateColumn.data
                .filter((item: { value: string; }) => {
                  // Compare only the date part
                  const itemDate = new Date(item.value).toISOString().split('T')[0];
                  return itemDate === selectedDate;
                })
                .map((item: { record_id: number; }) => item.record_id);
              
              // If SKU is also selected, we want the intersection
              if (selectedSKU) {
                dateRecords.forEach((recordId: number) => {
                  if (matchingRecordIds.has(recordId)) {
                    matchingRecordIds.add(recordId);
                  }
                });
              } else {
                dateRecords.forEach((recordId: number) => matchingRecordIds.add(recordId));
              }
            }
          }
          
          // If we have matching records, collect all their data
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
    enabled: !!(selectedSKU || selectedDate) // Only fetch data if either SKU or date is selected
  });

  // Scroll handling
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => { // Scroll to the bottom of the chat window when new messages are added
    scrollToBottom();
  }, [messages]);

  // Message handling
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent the form from submitting and refreshing the page
    if (!input.trim() || isLoading) return; // Don't send empty messages or if the AI is still processing

    const userMessage: ChatMessage = { role: 'user', content: input.trim() }; // Create a new user message
    setMessages(prev => [...prev, userMessage]); // Add the user message to the list
    setInput(''); // Clear the input field
    setIsLoading(true); // Set loading state while waiting for AI response

    try {
      const contextMessages: ChatMessage[] = [...messages];
      
      // Add context message if we have context data
      if (contextData && Object.keys(contextData).length > 0) {
        const contextInfo = [];
        if (selectedSKU) contextInfo.push(`SKU ${selectedSKU.value}`);
        if (selectedDate) contextInfo.push(`date ${selectedDate}`);
        
        const contextMessage: ChatMessage = {
          role: 'system',
          content: `Current context - Data for ${contextInfo.join(' and ')}:\n${JSON.stringify(contextData, null, 2)}`
        };
        contextMessages.push(contextMessage);
      }
      
      const response = await AIService.getChatResponse([...contextMessages, userMessage]); // Get AI response based on all messages
      const aiMessage: ChatMessage = { role: 'assistant', content: response }; // Create a new assistant message with the AI response
      setMessages(prev => [...prev, aiMessage]); // Add the assistant message to the list
    } catch (error) {
      console.error('Error getting AI response:', error);
      toast.error('Failed to get AI response. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Initial welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0) { // If the chat window is opened and there are no messages
      const welcomeMessage: ChatMessage = { // Create a welcome message from the AI assistant
        role: 'assistant',
        content: `Welcome to Baked Insights!\n\nI'm your AI assistant, and I can help you analyze production data and answer questions about:\n\n* Specific SKUs and dates in your production records\n* Production trends and patterns\n* Quality metrics and compliance\n* Historical data analysis\n\nSelect a SKU and/or date above to get specific information, or ask me any general questions about the system.`
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen]);

  if (!isOpen) return null; // If the chat window is not open, don't render anything

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
            options={skuData}
            placeholder="Select a SKU for context..."
            isClearable
            className="w-full mb-2"
          />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
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

      {/* Input - This contains the text input field and send button. It's fixed at the bottom of the window and handles user input.*/}
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