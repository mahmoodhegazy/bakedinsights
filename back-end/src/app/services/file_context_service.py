"""
Copyright (c) BakedInsights, Inc. and affiliates.
All rights reserved.
"""

from app.utils import FileManager
import json

class FileContextService:
    """Service for retrieving and organizing file context for AI"""
    
    @staticmethod
    def get_context_from_checklist_items(items):
        """
        Extract file content from checklist items
        
        Args:
            items: List of checklist items
            
        Returns:
            List of dictionaries with file content and metadata
        """
        file_contexts = []
        
        for item in items:
            if item.value_fpath:
                # Extract the file path (remove presigned URL if present)
                file_path = item.value_fpath
                if FileManager.PRESIGNED_URL_DEMARKATION in file_path:
                    file_path = file_path.split(FileManager.PRESIGNED_URL_DEMARKATION)[0]
                
                # Get file content
                file_content = FileManager.get_file_content(file_path)
                
                if not file_content.get("error"):
                    file_contexts.append({
                        "source": "checklist",
                        "item_id": item.id,
                        "file_path": file_path,
                        "content_type": file_content.get("content_type", ""),
                        "content": file_content.get("content", ""),
                        "size": file_content.get("size", 0)
                    })
        
        return file_contexts
    
    @staticmethod
    def get_context_from_table_data(table_data):
        """
        Extract file content from table data
        
        Args:
            table_data: List of TableData objects
            
        Returns:
            List of dictionaries with file content and metadata
        """
        file_contexts = []
        
        for data in table_data:
            if data.value_fpath:
                # Extract the file path
                file_path = data.value_fpath
                if FileManager.PRESIGNED_URL_DEMARKATION in file_path:
                    file_path = file_path.split(FileManager.PRESIGNED_URL_DEMARKATION)[0]
                
                # Get file content
                file_content = FileManager.get_file_content(file_path)
                
                if not file_content.get("error"):
                    # Get related column information
                    column = data.table_column
                    
                    file_contexts.append({
                        "source": "table",
                        "data_id": data.id,
                        "column_name": column.name if column else "Unknown",
                        "file_path": file_path,
                        "content_type": file_content.get("content_type", ""),
                        "content": file_content.get("content", ""),
                        "size": file_content.get("size", 0)
                    })
        
        return file_contexts

    @staticmethod
    def format_file_context_for_ai(file_contexts):
        """
        Format file contexts into a structure suitable for AI
        
        Args:
            file_contexts: List of file context dictionaries
            
        Returns:
            Formatted string with file contexts
        """
        if not file_contexts:
            return ""
            
        result = "## Attached Files\n\n"
        
        for i, ctx in enumerate(file_contexts):
            source = ctx.get("source", "unknown")
            file_path = ctx.get("file_path", "")
            content_type = ctx.get("content_type", "")
            content = ctx.get("content", "")
            
            # Format header based on source
            if source == "checklist":
                result += f"### File {i+1}: Checklist Attachment - {file_path}\n"
            elif source == "table":
                column_name = ctx.get("column_name", "Unknown Field")
                result += f"### File {i+1}: Table Attachment - {column_name} - {file_path}\n"
            else:
                result += f"### File {i+1}: {file_path}\n"
                
            result += f"Type: {content_type}\n\n"
            
            # Format content based on type
            if isinstance(content, dict) or isinstance(content, list):
                # Format structured data (CSV, Excel)
                try:
                    # First, try to format as headers/data structure
                    if isinstance(content, dict) and "headers" in content and "data" in content:
                        headers = content.get("headers", [])
                        data = content.get("data", [])
                        
                        result += f"Headers: {', '.join(headers)}\n\n"
                        result += "Data:\n"
                        
                        for j, row in enumerate(data):
                            if isinstance(row, dict):
                                row_str = ", ".join(f"{k}: {v}" for k, v in row.items())
                                result += f"Row {j+1}: {row_str}\n"
                            else:
                                result += f"Row {j+1}: {row}\n"
                    
                    # For Excel files (multiple sheets)
                    elif all(isinstance(sheet_data, dict) for sheet_data in content.values()):
                        for sheet_name, sheet_data in content.items():
                            result += f"\nSheet: {sheet_name}\n"
                            headers = sheet_data.get("headers", [])
                            data = sheet_data.get("data", [])
                            
                            result += f"Headers: {', '.join(headers)}\n"
                            result += "Data:\n"
                            
                            for j, row in enumerate(data[:10]):  # Limit to first 10 rows
                                if isinstance(row, dict):
                                    row_str = ", ".join(f"{k}: {v}" for k, v in row.items())
                                    result += f"Row {j+1}: {row_str}\n"
                            
                            if len(data) > 10:
                                result += f"...and {len(data) - 10} more rows\n"
                    
                    # Last resort - convert to JSON
                    else:
                        result += json.dumps(content, indent=2)
                
                except Exception as e:
                    result += f"Error formatting structured data: {str(e)}\n"
                    result += str(content)
            
            elif isinstance(content, str):
                # Text content
                if len(content) > 2000:
                    # Truncate long text
                    result += content[:2000] + "...\n[Content truncated due to length]\n"
                else:
                    result += content + "\n"
            else:
                result += str(content) + "\n"
                
            result += "\n---\n\n"
            
        return result