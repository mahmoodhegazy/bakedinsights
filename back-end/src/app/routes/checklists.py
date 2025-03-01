"""
Copyright (c) BakedInsights, Inc. and affiliates.
All rights reserved.
"""

from app.services.auth_service import AuthService
from app.services.checklist_service import ChecklistService
from app.services.user_service import UserService
from app.types import ADMIN_ROLES
from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

checklist_bp = Blueprint('checklists', __name__)


@checklist_bp.route('/templates', methods=['POST'])
@jwt_required()
def create_checklist_template():
    """
    Create New Checklist Template Endpoint
    Only accessible by admin and super_admin roles

    Request Body:
    {
        "title": string,
        "description": string,
    }

    Returns:
    {
        "message": string,
        "id": integer
    }
    """
    if not AuthService.validate_user_role(get_jwt_identity(), ADMIN_ROLES):
        return jsonify({"message": "Unauthorized"}), 403

    try:
        template = ChecklistService.create_checklist_template(
            data=request.get_json(),
            creator_id=get_jwt_identity()
        )
        return jsonify({
            "message": "Checklist template created",
            "id": template.id
        }), 201
    except ValueError as e:
        return jsonify({"message": str(e)}), 400
    except Exception as e:
        return jsonify({"message": "Error creating checklist template", "error": str(e)}), 500


@checklist_bp.route('/templates/<int:template_id>', methods=['PUT'])
@jwt_required()
def update_checklist_template(template_id):
    """
    Update Checklist Template Endpoint
    Only accessible by admin and super_admin roles

    Request Body:
    {
        "id": int,
        "title": string,
        "description": string,
        "created_by_username": string
        "created_at": string (ISO format)
        "fields": [
            {
                "name": string,
                "description": string,
                "data_type": string,
                "complete_by": string (ISO format),
            }
        ],
    }

    Returns:
    {
        "message": string,
        "id": integer
    }
    """
    if not AuthService.validate_user_role(get_jwt_identity(), ADMIN_ROLES):
        return jsonify({"message": "Unauthorized"}), 403

    if not ChecklistService.validate_user_for_template(user_id=get_jwt_identity(), template_id=template_id):
        return jsonify({"message": "Unauthorized"}), 403

    try:
        template = ChecklistService.update_checklist_template(
            data=request.get_json(),
            creator_id=get_jwt_identity()
        )
        return jsonify({
            "message": "Checklist template updated.",
            "id": template_id
        }), 201
    except ValueError as e:
        return jsonify({"message": str(e)}), 400
    except Exception as e:
        return jsonify({"message": "Error creating checklist template", "error": str(e)}), 500


@checklist_bp.route('/templates', methods=['GET'])
@jwt_required()
def get_all_templates():
    """
    Get Checklist Template Endpoint

    Returns:
    {
        "id": int,
        "title": string,
        "description": string,
        "created_by_username": string
        "created_at": string (ISO format)
    }
    """
    try:
        templates = ChecklistService.get_all_templates(user_id=get_jwt_identity())
        if not templates:
            return jsonify({"message": "No templats found"}), 200

        for template in templates:
            template["created_by_username"] = UserService.get_user_by_id(user_id=template["created_by"]).username
            del template["created_by"]
        return jsonify(templates), 200
    except Exception as e:
        return jsonify({"message": "Error getting template", "error": str(e)}), 500


@checklist_bp.route('/templates/<int:template_id>', methods=['GET'])
@jwt_required()
def get_template(template_id):
    """
    Get Checklist Template Endpoint

    Returns:
    {
        "id": int,
        "title": string,
        "description": string,
        "created_by_username": string
        "created_at": string (ISO format)
        "fields": [
            {
                "name": string,
                "description": string,
                "data_type": string,
                "complete_by": string (ISO format),
            }
        ],
    }
    """
    if not ChecklistService.validate_user_for_template(user_id=get_jwt_identity(), template_id=template_id):
        return jsonify({"message": "Unauthorized"}), 403

    try:
        template = ChecklistService.get_template(template_id)
        template["created_by_username"] = UserService.get_user_by_id(user_id=template["created_by"]).username
        del template["created_by"]
        return jsonify(template), 200
    except Exception as e:
        return jsonify({"message": "Error getting template", "error": str(e)}), 500


@checklist_bp.route('/templates/fields/<int:field_id>', methods=['DELETE'])
@jwt_required()
def delete_field(field_id):
    """
    Delete a ChecklistField Endpoint
    """
    if not AuthService.validate_user_role(get_jwt_identity(), ADMIN_ROLES):
        return jsonify({"message": "Unauthorized"}), 403

    if not ChecklistService.validate_user_for_field(user_id=get_jwt_identity(), field_id=field_id):
        return jsonify({"message": "Unauthorized"}), 403

    try:
        ChecklistService.delete_field(field_id)
        return jsonify({"message": "Field deleted successfully"}), 200
    except ValueError as e:
        return jsonify({"message": str(e)}), 400
    except Exception as e:
        return jsonify({"message": "Error deleting field", "error": str(e)}), 500


@checklist_bp.route('/templates/<int:template_id>', methods=['DELETE'])
@jwt_required()
def delete_template(template_id):
    """
    Delete Template Endpoint
    """
    if not AuthService.validate_user_role(get_jwt_identity(), ADMIN_ROLES):
        return jsonify({"message": "Unauthorized"}), 403

    if not ChecklistService.validate_user_for_template(user_id=get_jwt_identity(), template_id=template_id):
        return jsonify({"message": "Unauthorized"}), 403

    try:
        ChecklistService.delete_template(template_id)
        return jsonify({"message": "Template deleted successfully"}), 200
    except ValueError as e:
        return jsonify({"message": str(e)}), 400
    except Exception as e:
        return jsonify({"message": "Error deleting template", "error": str(e)}), 500


@checklist_bp.route('/', methods=['GET'])
@jwt_required()
def get_user_checklists():
    """
    Get Checklists Endpoint

    Return:
    [
        {
            "id": int,
            "template_id": int,
            "template_name": string,
            "created_by_username": string
            "created_at": string (ISO format),
            "num_tasks": int,
            "num_completed": int,
        }
    ]

    Returns:
    {
        "message": string,
        "id": integer
    }
    """
    try:
        checklists = ChecklistService.get_user_checklists(user_id=get_jwt_identity())
        if not checklists:
            return jsonify({"message": "No checklists found"}), 200

        for checklist in checklists:
            checklist["created_by_username"] = UserService.get_user_by_id(user_id=checklist["created_by"]).username
            del checklist["created_by"]
        return jsonify(checklists), 200
    except Exception as e:
        return jsonify({"message": "Error getting checklists", "error": str(e)}), 500


@checklist_bp.route('/<int:template_id>', methods=['POST'])
@jwt_required()
def create_checklist(template_id):
    """
    Create New Checklist Instance from Template
    Only accessible by admin and super_admin roles

    Returns:
    {
        "message": string,
        "id": integer
    }
    """
    try:
        checklist = ChecklistService.create_checklist(
            template_id=template_id,
            creator_id=get_jwt_identity()
        )
        return jsonify({
            "message": "Checklist created",
            "id": checklist.id
        }), 201
    except ValueError as e:
        return jsonify({"message": str(e)}), 400
    except Exception as e:
        return jsonify({"message": "Error creating checklist", "error": str(e)}), 500


@checklist_bp.route('/<int:checklist_id>', methods=['GET'])
@jwt_required()
def get_checklist(checklist_id):
    """
    Get Checklist Endpoint

    Returns:
    [
        {
            "id": int,
            "field_id": int,
            "value": int | float | string,
            "value_fpath": string,
            "comment": string,
            "completed_at": string | None
        }
    ],
    """
    if not ChecklistService.validate_user_for_checklist(user_id=get_jwt_identity(), checklist_id=checklist_id):
        return jsonify({"message": "Unauthorized"}), 403

    try:
        checklist_items = ChecklistService.get_checklist(checklist_id)
        return jsonify(checklist_items), 200
    except Exception as e:
        return jsonify({"message": "Error getting template", "error": str(e)}), 500


@checklist_bp.route('/<int:checklist_id>', methods=['DELETE'])
@jwt_required()
def delete_checklist(checklist_id):
    """
    Delete Template Endpoint
    """
    if not ChecklistService.validate_user_for_checklist(user_id=get_jwt_identity(), checklist_id=checklist_id):
        return jsonify({"message": "Unauthorized"}), 403

    try:
        ChecklistService.delete_checklist(checklist_id)
        return jsonify({"message": "Checklist deleted successfully"}), 200
    except ValueError as e:
        return jsonify({"message": str(e)}), 400
    except Exception as e:
        return jsonify({"message": "Error deleting checklist", "error": str(e)}), 500


@checklist_bp.route('/items', methods=['PUT', 'POST'])
@jwt_required()
def update_checklist_item():
    """
    Update Checklist Item Endpoint
    Only accessible by admin and super_admin roles

    Request Body:
    {
        "id": int,
        "field_id": int,
        "value": int | float | string,
        "value_fpath": string,
        "comment": string,
        "completed_at": string | None
    }

    Returns:
    {
        "message": string,
        "id": integer
    }
    """
    data = request.get_json()
    item_id = data["id"]
    if not ChecklistService.validate_user_for_item(user_id=get_jwt_identity(), item_id=item_id):
        return jsonify({"message": "Unauthorized"}), 403

    try:
        item = ChecklistService.update_checklist_item(
            data=data,
            updated_by=get_jwt_identity()
        )
        return jsonify({
            "message": "Checklist template updated.",
            "id": item.id
        }), 201
    except ValueError as e:
        return jsonify({"message": str(e)}), 400
    except Exception as e:
        return jsonify({"message": "Error creating checklist template", "error": str(e)}), 500


@checklist_bp.route('/<int:checklist_id>/submit', methods=['PUT', 'POST'])
@jwt_required()
def submit_checklist(checklist_id):
    """
    Delete Template Endpoint
    """
    if not ChecklistService.validate_user_for_checklist(user_id=get_jwt_identity(), checklist_id=checklist_id):
        return jsonify({"message": "Unauthorized"}), 403

    try:
        ChecklistService.submit_checklist(checklist_id)
        return jsonify({"message": "Checklist deleted successfully"}), 200
    except ValueError as e:
        return jsonify({"message": str(e)}), 400
    except Exception as e:
        return jsonify({"message": "Error deleting checklist", "error": str(e)}), 500


@checklist_bp.route('/templates/<int:template_id>/shares', methods=['POST', 'PUT'])
@jwt_required()
def share_template(template_id):
    """
    Share Table Endpoint

    Request Body:
    {
        "user_ids": [integer]
    }
    """
    user_id = get_jwt_identity()
    if not AuthService.validate_user_role(user_id, ADMIN_ROLES):
        return jsonify({"message": "Unauthorized"}), 403

    if not ChecklistService.validate_user_for_template(user_id=user_id, template_id=template_id):
        return jsonify({"message": "Unauthorized"}), 403

    try:
        shares = ChecklistService.share_template(
            acting_user_id=user_id,
            template_id=template_id,
            user_ids=request.get_json()['user_ids']
        )
        return jsonify({
            "message": "Template shared successfully",
            "shares": len(shares)
        }), 201
    except Exception as e:
        print(e)
        return jsonify({"message": "Error sharing template", "error": str(e)}), 500


@checklist_bp.route('/templates/<int:template_id>/shares', methods=['GET'])
@jwt_required()
def get_template_shares(template_id):
    """
    Get ChecklistShares for given template_id
    """
    user_id = get_jwt_identity()
    if not AuthService.validate_user_role(user_id, ADMIN_ROLES):
        return jsonify({"message": "Unauthorized"}), 403

    if not ChecklistService.validate_user_for_template(user_id=user_id, template_id=template_id):
        return jsonify({"message": "Unauthorized"}), 403

    try:
        shares = ChecklistService.get_template_shares(template_id=template_id)
        return jsonify({
            "message": "Got template shares",
            "shares": [{
                "id": share.id,
                "user_id": share.user_id,
                } for share in shares],
        }), 200
    except ValueError as e:
        return jsonify({"message": str(e)}), 400
    except Exception as e:
        return jsonify({"message": "Error getting template share", "error": str(e)}), 500
