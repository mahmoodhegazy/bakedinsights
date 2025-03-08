"""
Copyright (c) BakedInsights, Inc. and affiliates.
All rights reserved.
"""

import pandas as pd
import PyPDF2

class FileProcessingService:
    """Service for processing various file types"""
    
    @staticmethod
    def process_excel(filepath):
        """
        Process Excel file and return structured data
        
        Args:
            filepath: Path to the Excel file
            
        Returns:
            Dictionary with sheet data
        """
        # Read the Excel file
        xls = pd.ExcelFile(filepath)
        
        # Process each sheet
        result = {}
        for sheet_name in xls.sheet_names:
            df = pd.read_excel(xls, sheet_name)
            
            # Convert DataFrame to dictionary
            sheet_data = {
                'headers': df.columns.tolist(),
                'data': df.to_dict('records')
            }
            
            result[sheet_name] = sheet_data
        
        return result

    
    @staticmethod
    def process_pdf(filepath):
        """
        Extract text from PDF file
        
        Args:
            filepath: Path to the PDF file
            
        Returns:
            Extracted text content
        """
        text = ""
        
        with open(filepath, 'rb') as file:
            reader = PyPDF2.PdfReader(file)
            
            for page_num in range(len(reader.pages)):
                page = reader.pages[page_num]
                text += page.extract_text() + "\n\n"
        
        return text