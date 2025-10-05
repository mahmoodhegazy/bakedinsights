"""
Copyright (c) BakedInsights, Inc. and affiliates.
All rights reserved.
"""
import base64
import os
import time
from datetime import timedelta
from typing import Dict, List, Optional

import pyotp
from app import mail
from app.models.user import User
from flask import g, session
from flask_jwt_extended import create_access_token, get_jwt_identity
from flask_mail import Message


class AuthService:
    """ Authentication Service """

    @staticmethod
    def login(username: str, password: str) -> Optional[Dict]:
        """
        Authenticate user and generate JWT token

        Args:
            username: User's username
            password: User's password

        Returns:
            Dict containing access token if authentication successful, None otherwise
        """
        user = User.query.filter_by(tenant_id=g.tenant_id, username=username).first()
        if user and user.check_password(password) and not user.deactivated:
            access_token = create_access_token(
                identity=str(user.id),
                additional_claims={
                    'tenant_id': str(user.tenant_id),
                    'role': str(user.role)
                },
                expires_delta=timedelta(hours=1)
            )
            return {'access_token': access_token, 'role': user.role}
        return None

    @staticmethod
    def forgot_password(email: str) -> bool:
        """
        Validate email and sent OTP to email

        Args:
            email: User's email for resetting password

        Returns:
            Bool indicating whether OTP was sent to email
        """
        if not AuthService.validate_user_email(email):
            return False

        # Generate one-time-password (OTP)
        secret = base64.b32encode(os.urandom(10)).decode('utf-8')
        totp = pyotp.TOTP(secret)
        otp_code = totp.now()
        session['otp'] = otp_code
        session['otp_timestamp'] = time.time()
        session['otp_email'] = email

        # Send email
        msg = Message("Your one-time password for verification",
                      sender="noreply@bakedinsights.com",
                      recipients=[email])
        msg.body = f"Your one-time password is: {otp_code}. This code is valid for a limited time."
        mail.send(msg)
        return True

    @staticmethod
    def validate_user_email(email: str) -> bool:
        """
        Validate if there exists user with this email address

        Args:
            email: User's email

        Returns:
            Boolean indicating if there exists a user with this email
        """
        return User.query.filter_by(tenant_id=g.tenant_id, email=email).first() is not None

    @staticmethod
    def validate_user_role(user_id: int, required_roles: list) -> bool:
        """
        Validate if user has required role

        Args:
            user_id: ID of user to validate
            required_roles: List of roles that are allowed

        Returns:
            Boolean indicating if user has required role
        """
        user = User.query.filter_by(id=user_id, tenant_id=g.tenant_id).first()
        return user is not None and user.role in required_roles

    @staticmethod
    def validate_users_exist(user_ids: List[int]) -> bool:
        """
        Validate that all provided user IDs exist in the database

        Args:
            user_ids: List of user IDs to validate

        Returns:
            Boolean indicating if all users exist

        Raises:
            ValueError: If any user IDs are invalid
        """
        if not user_ids:
            raise ValueError("No users provided")

        existing_users = User.query.filter_by(tenant_id=g.tenant_id).filter(User.id.in_(user_ids)).all()
        if len(existing_users) != len(user_ids):
            invalid_ids = set(user_ids) - set(user.id for user in existing_users)
            raise ValueError(f"Invalid user IDs: {list(invalid_ids)}")

        return True

    @staticmethod
    def validate_user_id(user_id: int) -> bool:
        """
        Validate if user has required role

        Args:
            user_id: ID of user to validate
            required_roles: List of roles that are allowed

        Returns:
            Boolean indicating if user has required role
        """
        current_user_id = int(get_jwt_identity())
        return user_id == current_user_id
