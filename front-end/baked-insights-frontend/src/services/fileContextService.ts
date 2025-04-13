import api from '../api/axios';

export interface FileContextResponse {
  file_count: number;
  formatted_context: string;
}

export class FileContextService {
  /**
   * Get file context from backend based on SKU, Lot Number, Date Range, or Tables
   * 
   * @param sku Optional SKU to filter by
   * @param lotNumber Optional lot number to filter by
   * @param startDate Optional start date to filter by
   * @param endDate Optional end date to filter by
   * @param tableIds Optional array of table IDs to filter by
   * @returns Promise with formatted file context
   */
  static async getFileContext(
    sku?: string,
    lotNumber?: string, 
    startDate?: string,
    endDate?: string,
    tableIds?: number[]
  ): Promise<FileContextResponse> {
    try {
      // Build query parameters
      const params = new URLSearchParams();
      if (sku) params.append('sku', sku);
      if (lotNumber) params.append('lot_number', lotNumber);
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      
      // Add table IDs if provided
      if (tableIds && tableIds.length > 0) {
        tableIds.forEach(id => params.append('table_ids', id.toString()));
      }
      
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