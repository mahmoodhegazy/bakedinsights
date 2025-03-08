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
from app.models.table import TableData
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
        date: Date to filter by
        
    Returns:
        Structured file context information for AI
    """
    try:
        # Get query parameters
        sku = request.args.get('sku')
        lot_number = request.args.get('lot_number')
        date = request.args.get('date')
        
        # Must have at least one filter
        if not any([sku, lot_number, date]):
            return jsonify({
                "message": "At least one filter (sku, lot_number, date) must be provided"
            }), 400
            
        # Find matching table data with file attachments
        table_data_query = TableData.query.filter(TableData.value_fpath.isnot(None))
        
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
            
        if date:
            # Find records that have this date
            date_records = TableData.query.filter_by(value_date=date).all()
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

        # if date:
        #     checklist_items_query = checklist_items_query.filter_by(completed_at=date)   

            
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