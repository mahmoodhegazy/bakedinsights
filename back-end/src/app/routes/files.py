"""
Copyright (c) BakedInsights, Inc. and affiliates.
All rights reserved.
"""

import os
import tempfile

from app.hooks import setup_tenant_context
from app.services.file_context_service import FileContextService
from app.utils import FileProcessingService
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required

file_bp = Blueprint('files', __name__)
file_bp.before_request(setup_tenant_context)


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
def get_context_for_ai():
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
    sku = request.args.get('sku')
    lot_number = request.args.get('lot_number')
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')

    # Get table IDs (can be multiple)
    table_ids = request.args.getlist('table_ids')
    table_ids = [int(id) for id in table_ids] if table_ids else []

    # Get checklist IDs (can be multiple)
    template_ids = request.args.getlist('template_ids')
    template_ids = [int(id) for id in template_ids] if template_ids else []

    try:
        all_file_contexts, formatted_context = FileContextService.get_file_context_for_ai(
            sku=sku,
            lot_number=lot_number,
            start_date=start_date,
            end_date=end_date,
            table_ids=table_ids,
            template_ids=template_ids
        )

        if (all_file_contexts is not None) and (formatted_context is not None):
            return jsonify({
                "file_count": len(all_file_contexts),
                "formatted_context": formatted_context
            }), 200
    except Exception as e:
        return jsonify({"message": "Error getting context", "error": str(e)}), 500
