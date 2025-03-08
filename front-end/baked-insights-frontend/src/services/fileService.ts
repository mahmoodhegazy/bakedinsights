import api from '../api/axios';

export interface FileContent {
  headers: boolean;
  data(data: any): unknown;
  name: string;
  type: string;
  content: string;
  size: number;
}

export class FileService {
  /**
   * Reads a file and returns its content as text
   * 
   * @param file The file to read
   * @returns Promise with the file content
   */
  static async readFile(file: File): Promise<FileContent> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        if (event.target?.result) {
          resolve({
            name: file.name,
            type: file.type,
            content: event.target.result as string,
            size: file.size,
            headers: false,
            data: (data: any) => data
          });
        } else {
          reject(new Error('Failed to read file content'));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Error reading file'));
      };
      
      // Determine the appropriate reading method based on file type
      if (file.type.startsWith('text/') || 
          file.type === 'application/json' || 
          file.type === 'application/csv' ||
          file.name.endsWith('.csv') || 
          file.name.endsWith('.txt') || 
          file.name.endsWith('.json')) {
        reader.readAsText(file);
      } else if (file.type.includes('spreadsheet') || 
                file.type.includes('excel') || 
                file.name.endsWith('.xlsx') || 
                file.name.endsWith('.xls')) {
        // For binary files like Excel, we'll need to use the server to parse them
        reader.readAsDataURL(file);
      } else {
        // For other file types, read as data URL
        reader.readAsDataURL(file);
      }
    });
  }

  /**
   * Parses and processes file data based on file type
   * 
   * @param file The uploaded file
   * @returns Processed file data
   */
  static async processFile(file: File): Promise<any> {
    const fileContent = await this.readFile(file);
    
    // For CSV and text files, we'll process on client side
    if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
      return this.processCSV(fileContent.content);
    }
    
    // For PDF files, use the PDF processing method
    if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
      const pdfText = await this.processPDF(file);
      return {
        ...fileContent,
        content: pdfText
      };
    }
    
    // For Excel files, we'll need server-side processing
    if (file.type.includes('spreadsheet') || 
        file.type.includes('excel') || 
        file.name.endsWith('.xlsx') || 
        file.name.endsWith('.xls')) {
      return this.processExcelFile(file);
    }
    
    // Return raw content for text files
    return fileContent;
  }

  /**
   * Processes CSV file content into structured data
   * 
   * @param content CSV content as string
   * @returns Processed CSV data
   */
  private static processCSV(content: string): any {
    // Split by common line endings (handles both Windows and Unix)
    const lines = content.split(/\r?\n/).filter(line => line.trim().length > 0);
    
    if (lines.length === 0) {
      return { headers: [], data: [] };
    }
    
    // Extract headers from first line
    const headers = lines[0].split(',').map(header => header.trim());
    
    // Process data rows
    const data = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      const row: Record<string, string> = {};
      
      headers.forEach((header, index) => {
        row[header] = values[index]?.trim() || '';
      });
      
      data.push(row);
    }
      
    return {
      headers,
      data
    };
  }

  /**
   * Uploads an Excel file to the server for processing
   * 
   * @param file Excel file
   * @returns Processed Excel data
   */
  private static async processExcelFile(file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await api.post('/files/process-excel', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error processing Excel file:', error);
      throw new Error('Failed to process Excel file');
    }
  }

  /**
   * Extracts text from a PDF file
   * 
   * @param file PDF file
   * @returns Extracted text content
   */
  private static async processPDF(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await api.post('/files/process-pdf', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      return response.data.text;
    } catch (error) {
      console.error('Error processing PDF file:', error);
      throw new Error('Failed to process PDF file');
    }
  }
}