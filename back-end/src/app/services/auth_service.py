"""
Copyright (c) BakedInsights, Inc. and affiliates.
All rights reserved.
"""

from typing import Dict, List, Optional

from app.models.user import User
from flask_jwt_extended import create_access_token, get_jwt_identity


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
        user = User.query.filter_by(username=username).first()
        if user and user.check_password(password) and not user.deactivated:
            access_token = create_access_token(
                identity=user.id,
                additional_claims={'role': user.role}
            )
            return {'access_token': access_token, 'role': user.role}
        return None

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
        user = User.query.get(user_id)
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

        existing_users = User.query.filter(User.id.in_(user_ids)).all()
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
        current_user_id = get_jwt_identity()
        return user_id == current_user_id
