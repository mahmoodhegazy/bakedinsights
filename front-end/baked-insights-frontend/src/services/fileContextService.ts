import api from '../api/axios';

export interface FileContextResponse {
  file_count: number;
  formatted_context: string;
}

export class FileContextService {
  /**
   * Get file context from backend based on SKU, Lot Number, or Date
   * 
   * @param sku Optional SKU to filter by
   * @param lotNumber Optional lot number to filter by
   * @param date Optional date to filter by
   * @returns Promise with formatted file context
   */
  static async getFileContext(
    sku?: string,
    lotNumber?: string, 
    date?: string
  ): Promise<FileContextResponse> {
    try {
      // Build query parameters
      const params = new URLSearchParams();
      if (sku) params.append('sku', sku);
      if (lotNumber) params.append('lot_number', lotNumber);
      if (date) params.append('date', date);
      
      // Make the request
      const response = await api.get<FileContextResponse>(
        `/files/ai-context?${params.toString()}`
      );
      
      return response.data;
    } catch (error) {
      console.error('Error fetching file context:', error);
      return {
        file_count: 0,
        formatted_context: ''
      };
    }
  }
}