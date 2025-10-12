"""
Copyright (c) BakedInsights, Inc. and affiliates.
All rights reserved.
"""

import csv
import io
from app.hooks import setup_tenant_context
from app.services.table_service import TableService
from app.services.user_service import UserService
from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required


def get_current_user_id():
    """Helper function to get current user ID as integer"""
    return int(get_jwt_identity())


table_bp = Blueprint('tables', __name__)
table_bp.before_request(setup_tenant_context)


@table_bp.route('/assigned', methods=['GET'])
@jwt_required()
def get_user_tables():
    """
    Get all Table instances shared with user
    """
    user_id = get_current_user_id()
    try:
        table_shares = TableService.get_user_tables(user_id=user_id)
        resp_data = []
        for share in table_shares:
            table = TableService.get_table(table_id=share.table_id)
            user = UserService.get_user_by_id(user_id=table.created_by)
            resp_data.append({
                "id": table.id,
                "name": table.name,
                "created_by": table.created_by,
                "created_by_username": user.username,
                "created_at": table.created_at,
            })
        return jsonify({
            "message": "Got tables",
            "tables": resp_data,
        }), 200
    except ValueError as e:
        return jsonify({"message": str(e)}), 400
    except Exception as e:
        return jsonify({"message": "Error getting user tables", "error": str(e)}), 500


@table_bp.route('/<int:table_id>', methods=['GET'])
@jwt_required()
def get_table(table_id):
    """
    Get Table instance and all associated info (tabs, tab data, & shares)
    """
    user_id = get_current_user_id()
    if not TableService.validate_user_for_table(user_id=user_id, table_id=table_id):
        return jsonify({"message": "Unauthorized"}), 403

    try:
        table = TableService.get_table(table_id=table_id)
        created_by_username = UserService.get_user_by_id(user_id=table.created_by).username
        tabs = TableService.get_table_tabs(table_id=table_id)
        shares = TableService.get_table_shares(table_id=table_id)
        data = [TableService.get_tab_data(t.id) for t in tabs]
        return jsonify({
            "message": "Got table",
            "table": {
                "id": table.id,
                "name": table.name,
                "created_by": table.created_by,
                "created_by_username": created_by_username,
                "created_at": table.created_at,
                "tabs": [{
                    "id": tab.id,
                    "name": tab.name,
                    "tab_index": tab.tab_index,
                    "data": tab_data
                    } for tab, tab_data in zip(tabs, data)],
                "shares": [{
                    "id": share.id,
                    "user_id": share.user_id,
                    "shared_at": share.shared_at,
                    } for share in shares],
            },
        }), 200
    except ValueError as e:
        return jsonify({"message": str(e)}), 400
    except Exception as e:
        return jsonify({"message": "Error getting table", "error": str(e)}), 500


@table_bp.route('/<int:table_id>/shares', methods=['GET'])
@jwt_required()
def get_table_shares(table_id):
    """
    Get TableShares for given table_id
    """
    user_id = get_current_user_id()
    if not TableService.validate_user_for_table(user_id=user_id, table_id=table_id):
        return jsonify({"message": "Unauthorized"}), 403

    try:
        shares = TableService.get_table_shares(table_id=table_id)
        return jsonify({
            "message": "Got table",
            "shares": [{
                "id": share.id,
                "user_id": share.user_id,
                "shared_at": share.shared_at,
                } for share in shares],
        }), 200
    except ValueError as e:
        return jsonify({"message": str(e)}), 400
    except Exception as e:
        return jsonify({"message": "Error getting table", "error": str(e)}), 500



@table_bp.route('/columns', methods=['PUT', 'POST'])
@jwt_required()
def update_table_column():
    """
    Update Table Column Endpoint

    Request Body:
    {
        "column_id": int,
        "updates": {
            "name": string (optional),
            "data_type": string (optional),
            "column_index": integer (optional),
        }
    }
    """
    user_id = get_current_user_id()
    data = request.get_json()
    column_id = data["column_id"]
    if not TableService.validate_user_for_column(user_id=user_id, column_id=column_id):
        return jsonify({"message": "Unauthorized"}), 403

    try:
        updated_column = TableService.update_table_column(
                column_id=column_id,
                updates=data["updates"],
        )
        return jsonify({
            "message": "Data updated successfully",
            "updates": updated_column.id,
        }), 201
    except Exception as e:
        return jsonify({"message": f"Error updating table data: invalid operation.", "error": str(e)}), 500


@table_bp.route('/tabs/<int:tab_id>/data', methods=['PUT', 'POST'])
@jwt_required()
def update_table_data(tab_id):
    """
    Update Table Data Endpoint

    Request Body:
    {
        "record_id": integer,
        "updates": [{
                "column_id": integer,
                "value": string
            }]
    }
    """
    user_id = get_current_user_id()
    if not TableService.validate_user_for_tab(user_id=user_id, tab_id=tab_id):
        return jsonify({"message": "Unauthorized"}), 403

    data = dict(request.form)
    record_id = data.pop("record_id")
    if request.files:
        data.update(dict(request.files))

    # Parse form data: "'updates[index][key]' => updates: List[{column_id:int, value:str}]"
    updates = [{"column_id": None, "value": None} for k in data if "updates" in k and "column_id" in k]
    for key in data:
        if "updates" in key:  # updates[index][key]
            index = int(key.split("]")[0][8:])
            update_key = key.split("[")[-1][:-1]
            updates[index][update_key] = data[key]

    try:
        updated_data = TableService.update_table_data(
            tab_id=tab_id,
            record_id=record_id,
            updates=updates,
        )
        return jsonify({
            "message": "Data updated successfully",
            "updates": len(updated_data)
        }), 201
    except Exception as e:
        return jsonify({"message": "Error updating table data", "error": str(e)}), 500


@table_bp.route('/', methods=['POST'])
@jwt_required()
def create_table():
    """
    Create New Table Endpoint
    Only accessible by office staff and above

    Request Body:
    {
        "name": string,
        "tabs": [
            {
                "name": string,
                "columns": [
                    {
                        "name": string,
                        "data_type": string,
                    }
                ],
                "data": Optional[row [column]]
            }
        ]
    }
    """

    try:
        table = TableService.create_table(
            data=request.get_json(),
            creator_id=get_current_user_id()
        )
        return jsonify({
            "message": "Table created",
            "table_id": table.id
        }), 201

    except ValueError as e:
        return jsonify({"message": str(e)}), 400

    except Exception as e:
        return jsonify({"message": "Error creating table", "error": str(e)}), 500


@table_bp.route('/import', methods=['POST'])
@jwt_required()
def import_csv():
    """
    Import CSV File to Create New Table
    
    Accepts multipart/form-data with:
    - file: CSV file
    - name: table name (optional, defaults to filename)
    """
    try:
        # Check if file is present
        if 'file' not in request.files:
            return jsonify({"message": "No file provided"}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({"message": "No file selected"}), 400
        
        # Get table name from form or use filename
        table_name = request.form.get('name', file.filename.rsplit('.', 1)[0])
        
        # Read and parse CSV
        stream = io.StringIO(file.stream.read().decode("UTF8"), newline=None)
        csv_reader = csv.DictReader(stream)
        
        # Extract headers and determine data types
        fieldnames = csv_reader.fieldnames
        if not fieldnames:
            return jsonify({"message": "CSV file is empty or invalid"}), 400
        
        columns = []
        data_rows = []
        
        # Read first row to infer types
        first_row = None
        for row in csv_reader:
            if first_row is None:
                first_row = row
                # Infer data types from first row
                for column_name in fieldnames:
                    value = row.get(column_name, '')
                    # Simple type inference
                    try:
                        float(value)
                        data_type = 'number'
                    except (ValueError, TypeError):
                        data_type = 'text'
                    
                    columns.append({
                        "name": column_name,
                        "data_type": data_type
                    })
            
            # Convert row to list in column order
            row_data = [row.get(col, '') for col in fieldnames]
            data_rows.append(row_data)
        
        if not data_rows:
            return jsonify({"message": "CSV file contains no data rows"}), 400
        
        # Create table using existing service
        table_data = {
            "name": table_name,
            "tabs": [{
                "name": "Tab 1",
                "columns": columns,
                "data": data_rows
            }]
        }
        
        table = TableService.create_table(
            data=table_data,
            creator_id=get_current_user_id()
        )
        
        return jsonify({
            "message": "Table created from CSV",
            "table_id": table.id,
            "rows_imported": len(data_rows)
        }), 201
        
    except Exception as e:
        return jsonify({"message": "Error importing CSV", "error": str(e)}), 500


@table_bp.route('/records/<int:record_id>', methods=['DELETE'])
@jwt_required()
def delete_table_record(record_id):
    """
    Delete Table Record Endpoint
    """
    user_id = get_current_user_id()
    if not TableService.validate_user_for_record(user_id=user_id, record_id=record_id):
        return jsonify({"message": "Unauthorized"}), 403

    try:
        deleted_record = TableService.delete_table_record(record_id=record_id)
        return jsonify({
            "message": "Data deleted successfully",
            "updates": deleted_record.id
        }), 201
    except Exception as e:
        return jsonify({"message": "Error updating table data", "error": str(e)}), 500


@table_bp.route('/columns/<int:column_id>', methods=['DELETE'])
@jwt_required()
def delete_table_column(column_id):
    """
    Delete Table Column Endpoint
    Only accessible by table owner

    Returns:
    {
        "message": string
    }
    """
    if not TableService.validate_user_for_column(user_id=get_current_user_id(), column_id=column_id):
        return jsonify({"message": "Unauthorized"}), 403

    try:
        if TableService.delete_table_column(column_id):
            return jsonify({"message": "Column deleted successfully"}), 200
        return jsonify({"message": "Column not found"}), 404
    except Exception as e:
        return jsonify({"message": "Error deleting table", "error": str(e)}), 500


@table_bp.route('/<int:table_id>', methods=['DELETE'])
@jwt_required()
def delete_table(table_id):
    """
    Delete Table Endpoint
    Only accessible by table owner

    Returns:
    {
        "message": string
    }
    """
    table = TableService.get_table(table_id=table_id)
    if table.created_by != get_current_user_id():
        return jsonify({"message": "Unauthorized - Must be table creator"}), 403

    try:
        if TableService.delete_table(table_id):
            return jsonify({"message": "Table deleted successfully"}), 200
        return jsonify({"message": "Table not found"}), 404
    except Exception as e:
        return jsonify({"message": "Error deleting table", "error": str(e)}), 500


@table_bp.route('/<int:table_id>', methods=['PUT'])
@jwt_required()
def udpate_table(table_id):
    """
    Update Table Endpoint
    ALl users that have share access to table can update it

    Request Body:
    {
        "name": string
    }

    Returns:
    {
        "message": string,
        "table_id": integer
    }
    """
    if not TableService.validate_user_for_table(user_id=get_current_user_id(), table_id=table_id):
        return jsonify({"message": "Unauthorized"}), 403

    data = request.get_json()
    try:
        table = TableService.update_table(table_id, data["name"])
        if not table:
            return jsonify({"message": "Table not found"}), 404

        return jsonify({
            "message": "User table successfully",
            "table_id": table.id
        }), 200
    except ValueError as e:
        return jsonify({"message": str(e)}), 400
    except Exception as e:
        return jsonify({"message": "Error updating table", "error": str(e)}), 500


@table_bp.route('/tabs/<int:tab_id>', methods=['PUT'])
@jwt_required()
def udpate_table_tab(tab_id):
    """
    Update TableTab Endpoint
    ALl users that have share access to tab can update it

    Request Body:
    {
        "name": string
    }

    Returns:
    {
        "message": string,
        "tab_id": integer
    }
    """

    if not TableService.validate_user_for_tab(user_id=get_current_user_id(), tab_id=tab_id):
        return jsonify({"message": "Unauthorized"}), 403

    data = request.get_json()
    try:
        tab = TableService.update_tab(tab_id, data)
        if not tab:
            return jsonify({"message": "Tab not found"}), 404

        return jsonify({
            "message": "User table successfully",
            "tab_id": tab.id
        }), 200
    except ValueError as e:
        return jsonify({"message": str(e)}), 400
    except Exception as e:
        return jsonify({"message": "Error updating table", "error": str(e)}), 500


@table_bp.route('/tabs/<int:tab_id>', methods=['DELETE'])
@jwt_required()
def delete_table_tab(tab_id):
    """
    Delete TableTab Endpoint
    ALl users that have share access to tab can delete it

    Returns:
    {
        "message": string,
        "tab_id": integer
    }
    """
    if not TableService.validate_user_for_tab(user_id=get_current_user_id(), tab_id=tab_id):
        return jsonify({"message": "Unauthorized"}), 403

    try:
        if TableService.delete_tab(tab_id):
            return jsonify({
                "message": "Tab deleted successfully",
            }), 200
        else:
            return jsonify({"message": "Tab not found"}), 404
    except ValueError as e:
        return jsonify({"message": str(e)}), 400
    except Exception as e:
        return jsonify({"message": "Error updating table", "error": str(e)}), 500


@table_bp.route('/<int:table_id>/tabs', methods=['POST'])
@jwt_required()
def create_tab(table_id):
    """
    Create New Tab Endpoint
    Only accessible by office staff and above

    Request Body:
    {
        "name": string,
        "columns": [
            {
                "name": string,
                "data_type": string,
            }
        ],
    }
    """
    user_id = get_current_user_id()
    if not TableService.validate_user_for_table(user_id=user_id, table_id=table_id):
        return jsonify({"message": "Unauthorized"}), 403

    try:
        tab = TableService.create_tab(
            data=request.get_json(),
            table_id=table_id,
        )
        return jsonify({
            "message": "Tab created",
            "tab_id": tab.id
        }), 201
    except ValueError as e:
        return jsonify({"message": str(e)}), 400
    except Exception as e:
        return jsonify({"message": "Error creating table", "error": str(e)}), 500


@table_bp.route('/<int:table_id>/shares', methods=['POST', 'PUT'])
@jwt_required()
def share_table(table_id):
    """
    Share Table Endpoint

    Request Body:
    {
        "user_ids": [integer]
    }
    """
    user_id = get_current_user_id()
    if not TableService.validate_user_for_table(user_id=user_id, table_id=table_id):
        return jsonify({"message": "Unauthorized"}), 403

    try:
        shares = TableService.share_table(
            acting_user_id=user_id,
            table_id=table_id,
            user_ids=request.get_json()['user_ids']
        )
        return jsonify({
            "message": "Table shared successfully",
            "shares": len(shares)
        }), 201
    except Exception as e:
        return jsonify({"message": "Error sharing table", "error": str(e)}), 500
