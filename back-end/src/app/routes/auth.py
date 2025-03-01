"""
Copyright (c) BakedInsights, Inc. and affiliates.
All rights reserved.
"""

from app.services.auth_service import AuthService
from flask import Blueprint, jsonify, request

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['POST'])
def login():
    """
    User Login Endpoint

    Request Body:
    {
        "username": string,
        "password": string
    }

    Returns:
    {
        "access_token": string,
        "role": string
    }
    """
    data = request.get_json()

    if not data or 'username' not in data or 'password' not in data:
        return jsonify({"message": "Missing username or password"}), 400

    result = AuthService.login(data['username'], data['password'])

    if result:
        return jsonify(result), 200
    return jsonify({"message": "Invalid credentials"}), 401
