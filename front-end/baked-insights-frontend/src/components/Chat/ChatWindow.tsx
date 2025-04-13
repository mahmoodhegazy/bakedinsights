import React, { useState, useRef, useEffect } from 'react';
import { IoMdClose } from "react-icons/io";
import { IoAttach, IoDocument, IoRefreshOutline } from "react-icons/io5";
import Select, { MultiValue } from 'react-select';
import { AIService, ChatMessage, FileContext } from '../../services/aiService';
import { FileService } from '../../services/fileService';
import { toast } from 'react-toastify';
import FormattedMessage from './FormattedMessage';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import { formatDate } from '../../utils/dateUtils';
import { APIChecklist, APIChecklistField, APIChecklistItem, APIChecklistTemplate } from '../../types/checklist';
import { FileContextService } from '../../services/fileContextService';
import { useDataRefreshStore } from '../../hooks/useDataRefreshStore';
import { TableSelector } from './TableSelector';

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

// Interface for uploaded file
interface UploadedFile {
  file: File;
  content?: any; // Can be FileContent or structured data from CSV/Excel
  isProcessing: boolean;
  isProcessed: boolean;
  error?: string;
}

// Define interfaces for CSV/Excel structured data
interface StructuredFileData {
  headers?: string[];
  data?: Array<Record<string, any> | Array<any>>;
  [key: string]: any; // Allow other properties
}

interface ChatWindowProps {
  isOpen: boolean; // Controls visibility of the chat window
  onClose: () => void; // Function to close the chat window
}

const ChatWindow: React.FC<ChatWindowProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]); // Array of chat messages
  const [input, setInput] = useState(''); // Input text for the user
  const [isLoading, setIsLoading] = useState(false); // Loading state for AI processing
  const [selectedSKU, setSelectedSKU] = useState<SelectOption | null>(null);
  const [selectedLotNumber, setSelectedLotNumber] = useState<SelectOption | null>(null);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedTables, setSelectedTables] = useState<MultiValue<{
    value: number;
    label: string;
  }> | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null); // Reference for auto-scrolling
  const fileInputRef = useRef<HTMLInputElement>(null); // Reference for file input
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]); // State for uploaded files
  const [showFileUploadArea, setShowFileUploadArea] = useState(false); // Toggle for file upload area
  const [s3FileContext, setS3FileContext] = useState<string>('');
  const [fileContextCount, setFileContextCount] = useState<number>(0);
  const [isRefreshing, setIsRefreshing] = useState(false); // State for tracking manual refresh
  
  // Get React Query client for manual cache invalidation
  const queryClient = useQueryClient();
  
  // Access the data refresh store
  const addDataRefreshListener = useDataRefreshStore(state => state.addListener);

  // Set up a listener for data refresh events
  useEffect(() => {
    // Subscribe to data refresh events
    const unsubscribe = addDataRefreshListener((event) => {
      console.log('Data refresh event received:', event);
      
      // Invalidate queries based on the event type
      if (event === 'sku-created' || event === 'table-data-updated') {
        // Refresh SKU options
        queryClient.invalidateQueries({ queryKey: ['skuOptions'] });
      }
      
      if (event === 'lot-number-created' || event === 'table-data-updated') {
        // Refresh lot number options
        queryClient.invalidateQueries({ queryKey: ['lotNumberOptions'] });
      }
      
      if (event === 'checklist-created' || event === 'checklist-submitted') {
        // Refresh checklist data
        queryClient.invalidateQueries({ queryKey: ['userChecklists'] });
        queryClient.invalidateQueries({ queryKey: ['allChecklistDetails'] });
      }
      
      if (event === 'table-created' || event === 'table-data-updated') {
        // Refresh table context data
        queryClient.invalidateQueries({ queryKey: ['tableContextData'] });
      }
    });
    
    // Clean up subscription on unmount
    return () => unsubscribe();
  }, [addDataRefreshListener, queryClient]);

  // Query to fetch all checklist templates (to get fields data)
  const { data: checklistTemplates, isLoading: isLoadingTemplates } = useQuery<APIChecklistTemplate[]>({
    queryKey: ['checklistTemplates'],
    queryFn: async () => {
      try {
        const response = await api.get('/checklists/templates');
        return response.data;
      } catch (error) {
        console.error("Error fetching checklist templates:", error);
        return [];
      }
    },
    // Add a reasonable staleTime to avoid unnecessary refetches
    staleTime: 30000, // 30 seconds
  });

  // Query to fetch all user checklists
  const { data: userChecklists, isLoading: isLoadingChecklists } = useQuery<APIChecklist[]>({
    queryKey: ['userChecklists'],
    queryFn: async () => {
      try {
        const response = await api.get('/checklists/');
        return response.data;
      } catch (error) {
        console.error("Error fetching user checklists:", error);
        return [];
      }
    },
    // Add a reasonable staleTime to avoid unnecessary refetches
    staleTime: 30000, // 30 seconds
  });

  // Fetch all checklist details (with items)
  const { data: checklistDetails, isLoading: isLoadingChecklistDetails } = useQuery<
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
    enabled: !!(userChecklists && checklistTemplates),
    // Add a reasonable staleTime to avoid unnecessary refetches
    staleTime: 30000, // 30 seconds
  });

  // Collect all unique SKUs from both tables and checklists
  const { data: skuOptions, isLoading: isLoadingSKUs, refetch: refetchSKUs } = useQuery<SelectOption[]>({
    queryKey: ['skuOptions'],
    queryFn: async () => {
      setIsRefreshing(true);
      try {
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
              items.reduce((set: Set<string>, item: any) => {
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
        
        return skuArray.map(sku => ({
          value: sku,
          label: sku
        }));
      } finally {
        setIsRefreshing(false);
      }
    },
    // Add a reasonable staleTime to avoid unnecessary refetches
    staleTime: 30000, // 30 seconds
  });

  // Collect all unique lot numbers from both tables and checklists
  const { data: lotNumberOptions, isLoading: isLoadingLotNumbers, refetch: refetchLotNumbers } = useQuery<SelectOption[]>({
    queryKey: ['lotNumberOptions'],
    queryFn: async () => {
      setIsRefreshing(true);
      try {
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
      } finally {
        setIsRefreshing(false);
      }
    },
    // Add a reasonable staleTime to avoid unnecessary refetches
    staleTime: 30000, // 30 seconds
  });

  // Filter checklist data based on selected SKU and date
  const filteredChecklistData = React.useMemo(() => {
    if (!checklistDetails) return [];

    return checklistDetails
      .filter(({ checklist, items, templateFields }) => {
        // Date range filter
        if (startDate || endDate) {
          const checklistDate = new Date(checklist.created_at);
          const checklistDateStr = checklistDate.toISOString().split('T')[0];
          
          // Filter out dates before the start date (if specified)
          if (startDate && checklistDateStr < startDate) return false;
          
          // Filter out dates after the end date (if specified)
          if (endDate && checklistDateStr > endDate) return false;
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
  }, [checklistDetails, selectedSKU, selectedLotNumber, startDate, endDate]);

  // Query to fetch context data based on SKU, lot number, date selection, and tables
  const { data: tableContextData, isLoading: isLoadingTableContext, refetch: refetchTableContext } = useQuery({
    queryKey: ['tableContextData', selectedSKU?.value, selectedLotNumber?.value, startDate, endDate, selectedTables],
    queryFn: async () => {
      if (!selectedSKU && !selectedLotNumber && !(startDate || endDate) && (!selectedTables || selectedTables.length === 0)) {
        return null;
      }

      // If specific tables are selected, only fetch those
      let tablesToFetch = [];
      if (selectedTables && selectedTables.length > 0) {
        tablesToFetch = selectedTables.map(table => ({ id: table.value }));
      } else {
        // Otherwise fetch all tables
        const response = await api.get('/tables/assigned');
        tablesToFetch = response.data.tables;
      }
      
      const tableDataPromises = tablesToFetch.map((table: { id: any; }) => 
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
          
          // Filter by Date Range
          if (startDate || endDate) {
            const dateColumn = tab.data.find((col: TableData) => 
              col.header.column_data_type === 'date'
            );

            if (dateColumn) {
              const dateRecords = new Set<number>();
              
              dateColumn.data
                .filter((item: { value: string; }) => {
                  const itemDate = new Date(item.value);
                  const itemDateStr = itemDate.toISOString().split('T')[0];
                  
                  let inRange = true;
                  if (startDate && itemDateStr < startDate) inRange = false;
                  if (endDate && itemDateStr > endDate) inRange = false;
                  
                  return inRange;
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
          }
          
          // If no specific filters are applied but tables are selected, include all records
          if (matchingRecordIds.size === 0 && 
              !selectedSKU && !selectedLotNumber && !(startDate || endDate) && 
              selectedTables && selectedTables.length > 0) {
            // Get all record IDs from this tab
            tab.data.forEach((column: TableData) => {
              column.data.forEach((item: { record_id: number }) => {
                matchingRecordIds.add(item.record_id);
              });
            });
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
    enabled: !!(selectedSKU || selectedLotNumber || startDate || endDate || (selectedTables && selectedTables.length > 0))
  });

  // Prepare combined context data from both tables and checklists
  const contextData = React.useMemo(() => {
    return { 
      tables: tableContextData || {},
      checklists: filteredChecklistData || []
    };
  }, [tableContextData, filteredChecklistData]);

  // Reset all filters
  const resetFilters = () => {
    setSelectedSKU(null);
    setSelectedLotNumber(null);
    setStartDate('');
    setEndDate('');
    setSelectedTables(null);
  };

  // Manual refresh function for fetching latest data
  const handleManualRefresh = () => {
    setIsRefreshing(true);
    
    // Create an array of promises for all data refetches
    const refetchPromises = [
      refetchSKUs(),
      refetchLotNumbers(),
      queryClient.invalidateQueries({ queryKey: ['checklistTemplates'] }),
      queryClient.invalidateQueries({ queryKey: ['userChecklists'] }),
      queryClient.invalidateQueries({ queryKey: ['allChecklistDetails'] })
    ];
    
    // If context filters are set, also refresh context data
    if (selectedSKU || selectedLotNumber || startDate || endDate || (selectedTables && selectedTables.length > 0)) {
      refetchPromises.push(refetchTableContext());
    }
    
    // Wait for all refetches to complete
    Promise.all(refetchPromises)
      .catch(error => {
        console.error('Error refreshing data:', error);
        toast.error('Error refreshing data. Please try again.');
      })
      .finally(() => {
        setIsRefreshing(false);
        toast.success('Data refreshed successfully');
      });
  };

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    // Add files to state
    const newUploadedFiles: UploadedFile[] = Array.from(files).map(file => ({
      file,
      isProcessing: true,
      isProcessed: false
    }));
    
    setUploadedFiles(prev => [...prev, ...newUploadedFiles]);
    
    // Process each file
    for (let i = 0; i < newUploadedFiles.length; i++) {
      const uploadedFile = newUploadedFiles[i];
      
      try {
        // Use processFile instead of readFile to get file-type specific processing
        const processedContent = await FileService.processFile(uploadedFile.file);
        
        setUploadedFiles(prev => {
          const updatedFiles = [...prev];
          const fileIndex = updatedFiles.findIndex(
            f => f.file.name === uploadedFile.file.name && 
                f.file.size === uploadedFile.file.size
          );
          
          if (fileIndex !== -1) {
            updatedFiles[fileIndex] = {
              ...updatedFiles[fileIndex],
              content: processedContent,
              isProcessing: false,
              isProcessed: true
            };
          }
          
          return updatedFiles;
        });
        
        // Let the user know processing was successful
        toast.success(`Successfully processed ${uploadedFile.file.name}`);
      } catch (error) {
        console.error('Error processing file:', error);
        
        setUploadedFiles(prev => {
          const updatedFiles = [...prev];
          const fileIndex = updatedFiles.findIndex(
            f => f.file.name === uploadedFile.file.name && 
                f.file.size === uploadedFile.file.size
          );
          
          if (fileIndex !== -1) {
            updatedFiles[fileIndex] = {
              ...updatedFiles[fileIndex],
              isProcessing: false,
              isProcessed: false,
              error: error instanceof Error ? error.message : 'Error processing file'
            };
          }
          
          return updatedFiles;
        });
        
        toast.error(`Error processing file ${uploadedFile.file.name}`);
      }
    }
    
    // Clear the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Remove a file from the uploaded files
  const removeFile = (index: number) => {
    setUploadedFiles(prev => {
      const newFiles = [...prev];
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  // Prepare file contexts for AI
  const prepareFileContexts = (): FileContext[] => {
    return uploadedFiles
      .filter(file => file.isProcessed && file.content)
      .map(file => {
        const content = file.content as any;
        
        // Format structured data (for CSV, Excel) into a readable string
        let formattedContent = '';
        
        if (typeof content === 'object' && content !== null) {
          // Check if it matches our structured data format (CSV/Excel)
          const structuredData = content as StructuredFileData;
          
          if (structuredData.headers && Array.isArray(structuredData.data)) {
            // This is likely CSV data or processed Excel data
            formattedContent = `Headers: ${structuredData.headers.join(', ')}\n`;
            formattedContent += 'Data:\n';
            
            // Format each row
            structuredData.data.forEach((row, index) => {
              if (typeof row === 'object' && row !== null) {
                if (!Array.isArray(row)) {
                  // Handle row as object with named properties
                  formattedContent += `Row ${index + 1}: ${Object.entries(row)
                    .map(([key, value]) => `${key}: ${value}`)
                    .join(', ')}\n`;
                } else {
                  // Handle row as array
                  formattedContent += `Row ${index + 1}: ${row.join(', ')}\n`;
                }
              } else {
                // Handle primitive value
                formattedContent += `Row ${index + 1}: ${String(row)}\n`;
              }
            });
          } else if (content.content && typeof content.content === 'string') {
            // This is likely a text file with a content property
            formattedContent = content.content;
          } else {
            // Default: try to stringify the object
            try {
              formattedContent = JSON.stringify(content, null, 2);
            } catch (e) {
              formattedContent = 'Complex data structure (unable to display as text)';
            }
          }
        } else if (typeof content === 'string') {
          // Plain text content
          formattedContent = content;
        } else {
          // Unknown format, try to convert to string
          formattedContent = String(content || '');
        }
        
        return {
          metadata: {
            name: file.file.name,
            type: file.file.type,
            size: file.file.size
          },
          content: formattedContent
        };
      });
  };

  // Scroll handling
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch file context when filters change
  useEffect(() => {
    const fetchFileContext = async () => {
      if (selectedSKU || selectedLotNumber || startDate || endDate || (selectedTables && selectedTables.length > 0)) {
        const result = await FileContextService.getFileContext(
          selectedSKU?.value,
          selectedLotNumber?.value,
          startDate,
          endDate,
          selectedTables ? selectedTables.map(t => t.value) : undefined
        );
        
        setS3FileContext(result.formatted_context);
        setFileContextCount(result.file_count);
      } else {
        setS3FileContext('');
        setFileContextCount(0);
      }
    };
    
    fetchFileContext();
  }, [selectedSKU, selectedLotNumber, startDate, endDate, selectedTables]);

  // Message handling
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() && uploadedFiles.length === 0) return;
    if (isLoading) return;
  
    let userMessage: ChatMessage;
    
    // If there's no input but files are uploaded, create a default message
    if (!input.trim() && uploadedFiles.length > 0) {
      userMessage = { 
        role: 'user', 
        content: `I'm uploading ${uploadedFiles.length} file(s). Please analyze the content.`
      };
    } else {
      userMessage = { role: 'user', content: input.trim() };
    }
    
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
        if (selectedTables && selectedTables.length > 0) {
          const tableNames = selectedTables.map(t => t.label).join(', ');
          contextInfo.push(`Tables: ${tableNames}`);
        }
        if (startDate || endDate) {
          let dateFilter = "Date range: ";
          if (startDate) dateFilter += formatDate(startDate);
          dateFilter += " to ";
          if (endDate) dateFilter += formatDate(endDate);
          else dateFilter += "present";
          
          contextInfo.push(dateFilter);
        }
        
        const contextMessage: ChatMessage = {
          role: 'system',
          content: `Current context - Data for ${contextInfo.join(' and ')}:\n${JSON.stringify(contextData, null, 2)}`
        };
        contextMessages.push(contextMessage);
      }
      
      // Add S3 file context if available
      if (s3FileContext) {
        const fileContextMessage: ChatMessage = {
          role: 'system',
          content: `Attached files found for current context:\n${s3FileContext}`
        };
        contextMessages.push(fileContextMessage);
      }
      
      // Prepare file contexts from uploaded files
      const fileContexts = prepareFileContexts();
      
      // Debug logging to check the file contexts
      console.log("File contexts prepared for AI:", fileContexts);
      
      const response = await AIService.getChatResponse([...contextMessages, userMessage], fileContexts);
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
        content: `Welcome to Baked Insights!\n\nI'm your AI assistant, and I can help you analyze production data and answer questions about:\n\n* Specific SKUs and dates in your production records and checklists\n* Production trends and patterns\n* Quality metrics and compliance\n* Historical data analysis\n\nYou can upload files for analysis, or select a SKU and/or date above to get specific information. Feel free to ask me any general questions about the system.`
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen]);

  // Current context summary for display
  const contextSummary = React.useMemo(() => {
    if (!contextData) return null;
    
    const tableCount = Object.keys(contextData.tables).length;
    const checklistCount = contextData.checklists.length;
    const fileCount = uploadedFiles.filter(f => f.isProcessed).length;
    const s3FileCount = fileContextCount;
    
    if (tableCount === 0 && checklistCount === 0 && fileCount === 0 && s3FileCount === 0) return null;
    
    const contextFilters = [];
    if (selectedSKU) contextFilters.push(`SKU: ${selectedSKU.value}`);
    if (selectedLotNumber) contextFilters.push(`Lot#: ${selectedLotNumber.value}`);
    if (selectedTables && selectedTables.length > 0) {
      const tableNames = selectedTables.map(t => t.label).join(', ');
      contextFilters.push(`Tables: ${tableNames}`);
    }
    if (startDate || endDate) {
      let dateFilter = "Date range: ";
      if (startDate) dateFilter += formatDate(startDate);
      dateFilter += " to ";
      if (endDate) dateFilter += formatDate(endDate);
      else dateFilter += "present";
      
      contextFilters.push(dateFilter);
    }
    
    const filterText = contextFilters.length > 0 
      ? `Filters: ${contextFilters.join(', ')} | ` 
      : '';
    
    let dataSources = [];
    if (tableCount > 0) dataSources.push(`${tableCount} tables`);
    if (checklistCount > 0) dataSources.push(`${checklistCount} checklists`);
    if (fileCount > 0) dataSources.push(`${fileCount} uploaded files`);
    if (s3FileCount > 0) dataSources.push(`${s3FileCount} attached files`);
    
    return (
      <div className="text-xs text-gray-500 mt-1">
        {filterText}Using: {dataSources.join(', ')}
      </div>
    );
  }, [contextData, selectedSKU, selectedLotNumber, startDate, endDate, selectedTables, uploadedFiles, fileContextCount]);

  // Combine all loading states
  const isDataLoading = isLoadingTemplates || isLoadingChecklists || 
                       isLoadingChecklistDetails || isLoadingSKUs || 
                       isLoadingLotNumbers || isLoadingTableContext;

  if (!isOpen) return null;

  return (
    <div className={`fixed right-0 top-16 h-[calc(100vh-64px)] w-96 bg-white shadow-lg flex flex-col z-40 
      transition-transform duration-300 transform ${
      isOpen ? 'translate-x-0' : 'translate-x-full'
    }`}>
      {/* Header with filters */}
      <div className="flex flex-col p-4 border-b border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">AI Assistant</h2>
          <div className="flex items-center">
            {/* Add refresh button */}
            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing || isDataLoading}
              className={`text-gray-500 hover:text-blue-500 mr-2 ${isRefreshing || isDataLoading ? 'opacity-50 cursor-not-allowed animate-spin' : ''}`}
              title="Refresh data"
            >
              <IoRefreshOutline className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <IoMdClose className="w-6 h-6" />
            </button>
          </div>
        </div>
        <div className="space-y-2">
          <Select
            value={selectedSKU}
            onChange={(option) => setSelectedSKU(option)}
            options={skuOptions}
            placeholder="Select a SKU for context..."
            isClearable
            className="w-full mb-2"
            isLoading={isLoadingSKUs || isRefreshing}
          />
          
          <Select
            value={selectedLotNumber}
            onChange={(option) => setSelectedLotNumber(option)}
            options={lotNumberOptions}
            placeholder="Select a Lot Number..."
            isClearable
            className="w-full mb-2"
            isLoading={isLoadingLotNumbers || isRefreshing}
          />
          
          <div className="space-y-1">
            <div className="flex flex-col w-full">
              <label className="px-1 text-xs font-medium text-slate-400 mb-1">Date Range</label>
              <div className="flex space-x-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Start date"
                  disabled={isRefreshing}
                />
                <span className="flex items-center text-gray-500">to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="End date"
                  disabled={isRefreshing}
                />
              </div>
            </div>
          </div>

          <div className="space-y-1 mt-2">
            <div className="flex flex-col w-full">
              <label className="px-1 text-xs font-medium text-slate-400 mb-1">Tables</label>
              <TableSelector
                selectedTables={selectedTables}
                onChange={setSelectedTables}
              />
            </div>
          </div>
          
          {contextSummary}
          
          {(selectedSKU || selectedLotNumber || startDate || endDate || (selectedTables && selectedTables.length > 0)) && (
            <div className="flex justify-end mt-2">
              <button
                onClick={resetFilters}
                className="text-xs text-blue-500 hover:text-blue-700"
              >
                Reset filters
              </button>
            </div>
          )}
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

      {/* File Upload Area */}
      {showFileUploadArea && (
        <div className="px-4 pt-2 border-t border-gray-200">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-medium">Uploaded Files</h3>
            <button 
              onClick={() => setShowFileUploadArea(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <IoMdClose className="w-4 h-4" />
            </button>
          </div>
          
          {uploadedFiles.length > 0 ? (
            <div className="max-h-28 overflow-y-auto mb-2">
              {uploadedFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-1 bg-gray-50 rounded mb-1">
                  <div className="flex items-center">
                    <IoDocument className="text-gray-500 mr-2" />
                    <div>
                      <p className="text-xs font-medium truncate max-w-40">{file.file.name}</p>
                      <p className="text-xs text-gray-500">
                        {file.isProcessing 
                          ? 'Processing...' 
                          : file.isProcessed 
                            ? 'Ready' 
                            : file.error || 'Error'}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => removeFile(index)}
                    className="text-gray-500 hover:text-red-500"
                  >
                    <IoMdClose className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-2 text-sm text-gray-500">
              No files uploaded
            </div>
          )}
          
          <div className="flex justify-center mb-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
              multiple
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-blue-500 hover:text-blue-700 text-sm font-medium"
            >
              Upload Files
            </button>
          </div>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="border-t border-gray-200 p-4">
        <div className="flex space-x-2 items-center">
          <button
            type="button"
            onClick={() => setShowFileUploadArea(!showFileUploadArea)}
            className="text-gray-500 hover:text-blue-500"
          >
            <IoAttach className="w-5 h-5" />
          </button>
          
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
            disabled={isLoading || (!input.trim() && uploadedFiles.length === 0)}
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