"""
Copyright (c) BakedInsights, Inc. and affiliates.
All rights reserved.
"""

from app.services.auth_service import AuthService
from app.services.user_service import UserService
from app.types import ADMIN_ROLES, VALID_ROLES
from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt, get_jwt_identity, jwt_required

user_bp = Blueprint('users', __name__)


@user_bp.route('/', methods=['POST'])
@jwt_required()
def create_user():
    """
    Create New User Endpoint
    Only accessible by super_admin role

    Request Body:
    {
        "name": string,
        "username": string,
        "email": string,
        "phone": string,
        "employee_id": string,
        "password": string,
        "role": string
    }

    Returns:
    {
        "message": string,
        "user_id": integer
    }
    """
    # Verify super_admin role
    if not AuthService.validate_user_role(get_jwt_identity(), ADMIN_ROLES):
        return jsonify({"message": "Unauthorized - Super Admin access required"}), 403

    data = request.get_json()

    # Validate password strength if provided
    if 'password' in data and not UserService.validate_password(data['password']):
        return jsonify({
            "message": "Password must be at least 8 characters and contain uppercase, lowercase, and numbers"
        }), 400

    try:
        user = UserService.create_user(data)
        return jsonify({
            "message": "User created successfully",
            "user_id": user.id
        }), 201
    except ValueError as e:
        return jsonify({"message": str(e)}), 400
    except Exception as e:
        return jsonify({"message": "Error creating user", "error": str(e)}), 500


@user_bp.route('/', methods=['GET'])
@jwt_required()
def get_users():
    """
    Get Users Endpoint
    Returns filtered user list based on requester's role

    Returns:
    {
        "users": [
            {
                "id": integer,
                "username": string,
                "name": string,
                "role": string,
                "employee_id": string,
                "deactivated": boolean,
                "email": string (admin/super_admin only),
                "phone": string (admin/super_admin only)
            }
        ]
    }
    """
    claims = get_jwt()
    try:
        users = UserService.get_users()
        users_data = []
        for user in users:
            # Base user info
            user_data = {
                "id": user.id,
                "name": user.name,
                "username": user.username,
                "email": user.email,
                "phone": user.phone,
                "deactivated": user.deactivated,
            }

            # Add additional info for admin
            if claims["role"] in ADMIN_ROLES:
                user_data.update({
                    "employee_id": user.employee_id,
                    "role": user.role,
                })

            users_data.append(user_data)

        return jsonify({"users": users_data}), 200
    except Exception as e:
        return jsonify({"message": "Error retrieving users", "error": str(e)}), 500


@user_bp.route('/<int:user_id>', methods=['GET'])
@jwt_required()
def get_user(user_id):
    """
    Get Single User Endpoint

    Returns:
    {
        "user": {
            "id": integer,
            "username": string,
            "role": string,
            "employee_id": string,
            "deactivated": boolean,
            "email": string (admin/super_admin only),
            "phone": string (admin/super_admin only)
        }
    }
    """
    try:
        user = UserService.get_user_by_id(user_id)
        if not user:
            return jsonify({"message": "User not found"}), 404

        # Filter data based on requester's role
        claims = get_jwt()
        user_data = {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "phone": user.phone,
            "deactivated": user.deactivated,
        }

        if claims['role'] in ADMIN_ROLES:
            user_data.update({
                "employee_id": user.employee_id,
                "role": user.role,
            })

        return jsonify({"user": user_data}), 200
    except Exception as e:
        return jsonify({"message": "Error retrieving user", "error": str(e)}), 500


@user_bp.route('/current', methods=['GET'])
@jwt_required()
def get_current_user():
    """
    Get Current User Endpoint

    Returns:
    {
        "user": {
            "id": integer,
            "username": string,
            "name": string,
            "role": string,
            "is_admin_role": boolean,
            "employee_id": string,
            "deactivated": boolean,
            "email": string (admin/super_admin only),
            "phone": string (admin/super_admin only)
        }
    }
    """
    user_id = get_jwt_identity()
    try:
        user = UserService.get_user_by_id(user_id)
        if not user:
            return jsonify({"message": "User not found"}), 404

        user_data = {
            "id": user.id,
            "username": user.username,
            "name": user.name,
            "role": user.role,
            "is_admin_role": user.role in ADMIN_ROLES,
            "employee_id": user.employee_id,
            "email": user.email,
            "phone": user.phone,
            "deactivated": user.deactivated,
        }

        return jsonify({"user": user_data}), 200
    except Exception as e:
        return jsonify({"message": "Error retrieving user", "error": str(e)}), 500


@user_bp.route('/<int:user_id>', methods=['PUT'])
@jwt_required()
def update_user(user_id):
    """
    Update User Endpoint
    Only super_admin can update roles
    Users can update their own information

    Request Body:
    {
        "username": string (optional),
        "email": string (optional),
        "phone": string (optional),
        "password": string (optional),
        "role": string (super_admin only)
        "deactivated": boolean (optional),
    }

    Returns:
    {
        "message": string,
        "user_id": integer
    }
    """
    claims = get_jwt()

    # Only allow updates to own account or if super_admin
    if not AuthService.validate_user_id(user_id) and claims["role"] not in ADMIN_ROLES:
        return jsonify({"message": "Unauthorized"}), 403

    data = request.get_json()

    # Only super_admin can update roles
    if claims["role"] not in ADMIN_ROLES:
        data.pop("name", None)
        data.pop("username", None)
        data.pop("email", None)
        data.pop("employee_id", None)
        data.pop("role", None)
        data.pop("deactivated", None)

    # Validate password if provided
    if 'password' in data and not UserService.validate_password(data['password']):
        return jsonify({
            "message": "Password must be at least 8 characters and contain uppercase, lowercase, and numbers"
        }), 400

    try:
        user = UserService.update_user(user_id, data)
        if not user:
            return jsonify({"message": "User not found"}), 404
        return jsonify({
            "message": "User updated successfully",
            "user_id": user.id
        }), 200
    except ValueError as e:
        return jsonify({"message": str(e)}), 400
    except Exception as e:
        return jsonify({"message": "Error updating user", "error": str(e)}), 500


@user_bp.route('/<int:user_id>', methods=['DELETE'])
@jwt_required()
def delete_user(user_id):
    """
    Delete User Endpoint
    Only accessible by super_admin

    Returns:
    {
        "message": string
    }
    """
    if not AuthService.validate_user_role(get_jwt_identity(), ADMIN_ROLES):
        return jsonify({"message": "Unauthorized - Super Admin access required"}), 403

    if AuthService.validate_user_id(user_id):
        return jsonify({"message": "Unauthorized - Cannot delete the acocunt you are currently logged in with"}), 403
    try:
        if UserService.delete_user(user_id):
            return jsonify({"message": "User deleted successfully"}), 200
        return jsonify({"message": "User not found"}), 404
    except Exception as e:
        return jsonify({"message": "Error deleting user", "error": str(e)}), 500


@user_bp.route('/roles', methods=['GET'])
@jwt_required()
def get_user_roles():
    """
    Get User Roless Endpoint
    Returns list of valid user roles

    Returns:
        {"roles": List[str]}
    """
    try:
        return jsonify({"roles": VALID_ROLES}), 200
    except Exception as e:
        return jsonify({"message": "Error retrieving valid roles", "error": str(e)}), 500
