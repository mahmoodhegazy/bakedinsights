"""
Copyright (c) BakedInsights, Inc. and affiliates.
All rights reserved.
"""

import json

from app.models.checklist import Checklist, ChecklistItem
from app.models.table import Table, TableData
from app.utils import FileManager
from flask import g


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

    @staticmethod
    def get_file_context_for_ai(
        sku=None,
        lot_number=None,
        start_date=None,
        end_date=None,
        table_ids=None,
        template_ids=None,
    ):
        """
        Get File Context for AI Endpoint

        Query Parameters:
            sku: SKU to filter by
            lot_number: Lot number to filter by
            start_date: Start date for date range
            end_date: End date for date range
            table_ids: Table IDs to filter by (can be multiple)
            checklist_ids: Checklist IDs to filter by (can be multiple)

        Returns:
            Structured file context information for AI
        """
        try:
            # Get query parameters
            # Must have at least one filter
            if not any([sku, lot_number, start_date, end_date, table_ids, template_ids]):
                raise Exception("At least one filter (SKU, LOT number, Date Range, Tables, Templates) must be provided")

            # Find matching table data with file attachments
            table_data_query = TableData.query.filter(
                TableData.value_fpath.isnot(None),
                TableData.tenant_id == g.tenant_id
            )

            # Apply table filter if specified
            if table_ids:
                # Find tables with the specified IDs
                tables = Table.query.filter(
                    Table.id.in_(table_ids),
                    Table.tenant_id == g.tenant_id,
                ).all()
                if not tables:
                    raise Exception("No tables found with the provided IDs")

                # Get all tab IDs from the selected tables
                tab_ids = []
                for table in tables:
                    for tab in table.tabs:
                        tab_ids.append(tab.id)

                # Filter table data by tab IDs
                table_data_query = table_data_query.filter(TableData.tab_id.in_(tab_ids))

            # Apply filters
            if sku:
                # Find records that have this SKU
                sku_records = TableData.query.filter_by(value_sku=sku, tenant_id=g.tenant_id).all()
                record_ids = [data.record_id for data in sku_records]
                table_data_query = table_data_query.filter(TableData.record_id.in_(record_ids))

            if lot_number:
                # Find records that have this lot number
                lot_records = TableData.query.filter_by(value_lotnum=lot_number, tenant_id=g.tenant_id).all()
                record_ids = [data.record_id for data in lot_records]
                table_data_query = table_data_query.filter(TableData.record_id.in_(record_ids))

            if start_date or end_date:
                # Find records that fall within the date range
                date_records = []
                date_query = TableData.query.filter(TableData.tenant_id == g.tenant_id)

                if start_date and end_date:
                    # Filter records between start_date and end_date
                    date_records = date_query.filter(
                        TableData.value_date >= start_date,
                        TableData.value_date <= end_date
                    ).all()
                elif start_date:
                    # Filter records on or after start_date
                    date_records = date_query.filter(
                        TableData.value_date >= start_date
                    ).all()
                elif end_date:
                    # Filter records on or before end_date
                    date_records = date_query.filter(
                        TableData.value_date <= end_date
                    ).all()

                record_ids = [data.record_id for data in date_records]
                table_data_query = table_data_query.filter(TableData.record_id.in_(record_ids))

            # Execute query
            table_data = table_data_query.all()

            # Find matching checklist items with file attachments
            checklist_items_query = ChecklistItem.query.filter(
                ChecklistItem.value_fpath.isnot(None),
                ChecklistItem.tenant_id == g.tenant_id
            )

            # Apply filters to checklist items
            if template_ids:
                # Find all checklists that belong to the specified templates
                checklists_for_templates = Checklist.query.filter(
                    Checklist.template_id.in_(template_ids),
                    Checklist.tenant_id == g.tenant_id
                ).all()

                if not checklists_for_templates:
                    # No checklists found for these templates, but that's okay - just empty results
                    checklist_items_query = checklist_items_query.filter(False)
                else:
                    # Get all checklist IDs from the matching checklists
                    checklist_ids = [checklist.id for checklist in checklists_for_templates]
                    # Filter checklist items to only those from these checklists
                    checklist_items_query = checklist_items_query.filter(ChecklistItem.checklist_id.in_(checklist_ids))

            if sku:
                checklist_items_query = checklist_items_query.filter_by(value_sku=sku)

            if lot_number:
                checklist_items_query = checklist_items_query.filter_by(value_lotnum=lot_number)

            # Apply date range filter to checklist items
            if start_date or end_date:
                if start_date and end_date:
                    checklist_items_query = checklist_items_query.filter(
                        ChecklistItem.completed_at >= start_date,
                        ChecklistItem.completed_at <= end_date
                    )
                elif start_date:
                    checklist_items_query = checklist_items_query.filter(
                        ChecklistItem.completed_at >= start_date
                    )
                elif end_date:
                    checklist_items_query = checklist_items_query.filter(
                        ChecklistItem.completed_at <= end_date
                    )

            # Execute query
            checklist_items = checklist_items_query.all()

            # Get file context from both sources
            table_file_contexts = FileContextService.get_context_from_table_data(table_data)
            checklist_file_contexts = FileContextService.get_context_from_checklist_items(checklist_items)

            # Combine contexts
            all_file_contexts = table_file_contexts + checklist_file_contexts

            # Format for AI
            return (
                all_file_contexts,
                FileContextService.format_file_context_for_ai(all_file_contexts),
            )

        except Exception as e:
            raise Exception(f"Error retrieving file context: {str(e)}")
