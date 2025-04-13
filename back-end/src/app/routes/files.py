"""
Copyright (c) BakedInsights, Inc. and affiliates.
All rights reserved.
"""

import os
import tempfile
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
from app.services.file_service import FileProcessingService
from app.services.file_context_service import FileContextService
from app.models.table import TableData, Table
from app.models.checklist import ChecklistItem

file_bp = Blueprint('files', __name__)

@file_bp.route('/process-excel', methods=['POST'])
def process_excel():
    """
    Process Excel File Endpoint
    
    Takes an Excel file in the request and returns processed data
    """
    if 'file' not in request.files:
        return jsonify({"message": "No file provided"}), 400
        
    file = request.files['file']
    if file.filename == '':
        return jsonify({"message": "No file selected"}), 400
        
    if not allowed_excel_file(file.filename):
        return jsonify({"message": "File type not allowed"}), 400
        
    try:
        # Save the file temporarily
        temp_file = tempfile.NamedTemporaryFile(delete=False)
        file.save(temp_file.name)
        temp_file.close()
        
        # Process the Excel file
        data = FileProcessingService.process_excel(temp_file.name)
        
        # Clean up
        os.unlink(temp_file.name)
        
        return jsonify(data), 200
    except Exception as e:
        return jsonify({"message": f"Error processing file: {str(e)}"}), 500

@file_bp.route('/process-pdf', methods=['POST'])
def process_pdf():
    """
    Process PDF File Endpoint
    
    Takes a PDF file in the request and returns extracted text
    """
    if 'file' not in request.files:
        return jsonify({"message": "No file provided"}), 400
        
    file = request.files['file']
    if file.filename == '':
        return jsonify({"message": "No file selected"}), 400
        
    if not allowed_pdf_file(file.filename):
        return jsonify({"message": "File type not allowed"}), 400
        
    try:
        # Save the file temporarily
        temp_file = tempfile.NamedTemporaryFile(delete=False)
        file.save(temp_file.name)
        temp_file.close()
        
        # Process the PDF file
        text = FileProcessingService.process_pdf(temp_file.name)
        
        # Clean up
        os.unlink(temp_file.name)
        
        return jsonify({"text": text}), 200
    except Exception as e:
        return jsonify({"message": f"Error processing file: {str(e)}"}), 500

def allowed_excel_file(filename):
    """Check if file is an allowed Excel file"""
    allowed_extensions = {'xlsx', 'xls', 'xlsm', 'csv'}
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in allowed_extensions

def allowed_pdf_file(filename):
    """Check if file is an allowed PDF file"""
    allowed_extensions = {'pdf'}
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in allowed_extensions

@file_bp.route('/ai-context', methods=['GET'])
@jwt_required()
def get_file_context_for_ai():
    """
    Get File Context for AI Endpoint
    
    Query Parameters:
        sku: SKU to filter by
        lot_number: Lot number to filter by
        start_date: Start date for date range
        end_date: End date for date range
        table_ids: Table IDs to filter by (can be multiple)
        
    Returns:
        Structured file context information for AI
    """
    try:
        # Get query parameters
        sku = request.args.get('sku')
        lot_number = request.args.get('lot_number')
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        # Get table IDs (can be multiple)
        table_ids = request.args.getlist('table_ids')
        table_ids = [int(id) for id in table_ids] if table_ids else []
        
        # Must have at least one filter
        if not any([sku, lot_number, start_date, end_date, table_ids]):
            return jsonify({
                "message": "At least one filter (SKU, LOT number, Date Range, Tables) must be provided"
            }), 400
            
        # Find matching table data with file attachments
        table_data_query = TableData.query.filter(TableData.value_fpath.isnot(None))
        
        # Apply table filter if specified
        if table_ids:
            # Find tables with the specified IDs
            tables = Table.query.filter(Table.id.in_(table_ids)).all()
            if not tables:
                return jsonify({
                    "message": "No tables found with the provided IDs"
                }), 404
                
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
            sku_records = TableData.query.filter_by(value_sku=sku).all()
            record_ids = [data.record_id for data in sku_records]
            table_data_query = table_data_query.filter(TableData.record_id.in_(record_ids))
            
        if lot_number:
            # Find records that have this lot number
            lot_records = TableData.query.filter_by(value_lotnum=lot_number).all()
            record_ids = [data.record_id for data in lot_records]
            table_data_query = table_data_query.filter(TableData.record_id.in_(record_ids))
            
        if start_date or end_date:
            # Find records that fall within the date range
            date_records = []
            date_query = TableData.query
            
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
        checklist_items_query = ChecklistItem.query.filter(ChecklistItem.value_fpath.isnot(None))
        
        # Apply filters to checklist items
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
        formatted_context = FileContextService.format_file_context_for_ai(all_file_contexts)
        
        return jsonify({
            "file_count": len(all_file_contexts),
            "formatted_context": formatted_context
        }), 200
        
    except Exception as e:
        return jsonify({"message": f"Error retrieving file context: {str(e)}"}), 500