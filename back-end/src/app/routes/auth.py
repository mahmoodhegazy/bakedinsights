"""
Copyright (c) BakedInsights, Inc. and affiliates.
All rights reserved.
"""

import time

from app.services.auth_service import AuthService
from app.services.user_service import UserService
from flask import Blueprint, g, jsonify, request, session

auth_bp = Blueprint('auth', __name__)

OTP_EXPIRY_SECONDS = 600  # 10 minutes


@auth_bp.route('/login/<int:tenant_id>', methods=['POST'])
def login(tenant_id):
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
    g.tenant_id = tenant_id
    data = request.get_json()

    if not data or 'username' not in data or 'password' not in data:
        return jsonify({"message": "Missing username or password"}), 400

    result = AuthService.login(data['username'], data['password'])

    if result:
        return jsonify(result), 200
    return jsonify({"message": "Invalid credentials"}), 401


@auth_bp.route('forgot-password/<int:tenant_id>', methods=['POST'])
def forgot_password(tenant_id):
    """
    Forogt Password Endpoint

    Request Body:
    {
        "email": string,
    }
    """
    g.tenant_id = tenant_id
    data = request.get_json()

    if not data or 'email' not in data:
        return jsonify({"message": "Missing email"}), 400

    if AuthService.forgot_password(data['email']):
        return jsonify({"message": "Verification code sent"}), 200

    return jsonify({"message": "Invalid email"}), 401


@auth_bp.route('reset-password/<int:tenant_id>', methods=['POST'])
def validate_otp(tenant_id):
    """
    Validate OTP and Reset password Endpoint

    Request Body:
    {
        "otp": string,
        "password": string
    }

    Returns:
    {
        "user_id:": int
    }

    """
    g.tenant_id = tenant_id
    data = request.get_json()
    user_otp = data.get('otp')
    new_password = data.get('password')

    stored_otp = session.get('otp')
    otp_timestamp = session.get('otp_timestamp')
    otp_email = session.get('otp_email')

    if not stored_otp or not otp_timestamp or not otp_email:
        return jsonify({"error": "OTP not found or expired."}), 400

    if not AuthService.validate_user_email(otp_email):
        return jsonify({"error": "User email associated with OTP no longer exists."}), 400

    # Check if OTP has expired
    if time.time() - otp_timestamp > OTP_EXPIRY_SECONDS:
        session.pop('otp', None)
        session.pop('otp_timestamp', None)
        return jsonify({"error": "OTP expired."}), 400

    # Valid OTP => update user password
    if str(user_otp) == str(stored_otp):
        session.pop('otp', None)
        session.pop('otp_timestamp', None)
        session.pop('otp_email', None)
        user_id = UserService.get_user_by_email(otp_email).id
        UserService.update_user(user_id, {'password': new_password})
        return jsonify({"message": "Successfully reseet password!", "user_id": user_id})

    return jsonify({"error": "Invalid OTP."}), 400
