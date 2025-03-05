"""
Copyright (c) BakedInsights, Inc. and affiliates.
All rights reserved.
"""


from typing import Dict, List, Optional

from app import db
from app.models.user import User
from app.types import VALID_ROLES

# from validate_email import validate_email


class UserService:
    """ User Service """

    @staticmethod
    def create_user(data: Dict) -> User:
        """
        Create a new user

        Args:
            data: Dictionary containing user data
                {
                    "name" string,
                    "username": string,
                    "email": string,
                    "phone": string (optional),
                    "employee_id": string,
                    "deactivated": boolean,
                    "password": string,
                    "role": string
                }

        Returns:
            Created User instance

        Raises:
            ValueError: If required fields are missing or invalid
        """

        # Validate required fields
        required_fields = ['name', 'username', 'email', 'employee_id', 'password', 'role']
        if not all(field in data for field in required_fields) or not all(len(data[f]) > 0 for f in required_fields):
            raise ValueError("Missing required fields")

        # Validate role
        if data['role'] not in VALID_ROLES:
            raise ValueError(f"Invalid role. Must be one of: {', '.join(VALID_ROLES)}")

        # Validate password strength if provided
        if not UserService.validate_password(data['password']):
            raise ValueError("Password must be at least 8 characeters and contain a number and uppercase and lowercase letters")

        # if not validate_email(email_address=data["email"],
        #                       check_regex=True, check_mx=True,
        #                       from_address='my@from.addr.ess', helo_host='my.host.name',
        #                       smtp_timeout=10, dns_timeout=10, use_blacklist=True):
        #     raise ValueError("Invalid email")

        # Check for existing user
        if User.query.filter_by(username=data['username']).first():
            raise ValueError("Username already exists")
        if User.query.filter_by(email=data['email']).first():
            raise ValueError("Email already exists")
        if User.query.filter_by(employee_id=data['employee_id']).first():
            raise ValueError("Employee ID already exists")

        # Create new user
        user = User(
            name=data['name'],
            username=data['username'],
            email=data['email'],
            phone=data['phone'],
            employee_id=data['employee_id'],
            role=data['role']
        )
        user.set_password(data['password'])

        try:
            db.session.add(user)
            db.session.commit()
            return user
        except Exception as e:
            db.session.rollback()
            raise Exception(f"Error creating user: {str(e)}") from e

    @staticmethod
    def get_users() -> List[User]:
        """
        Get list of users with role-based information filtering

        Args:
            requester_role: Role of the user requesting the information

        Returns:
            List of user dictionaries with filtered information based on requester's role
        """
        return User.query.all()

    @staticmethod
    def get_user_by_id(user_id: int) -> Optional[User]:
        """
        Get user by ID

        Args:
            user_id: ID of user to retrieve

        Returns:
            User instance if found, None otherwise
        """
        return User.query.get(user_id)

    @staticmethod
    def update_user(user_id: int, data: Dict) -> Optional[User]:
        """
        Update user information

        Args:
            user_id: ID of user to update
            data: Dictionary containing fields to update

        Returns:
            Updated User instance if successful, None if user not found

        Raises:
            ValueError: If update data is invalid
        """
        user = User.query.get(user_id)
        if not user:
            return None

        # Update basic information
        if 'name' in data:
            user.name = data['name']

        if 'username' in data:
            existing_username = User.query.filter_by(email=data['username']).first()
            if existing_username and existing_username.id != user_id:
                raise ValueError("Username already exists")
            user.username = data['username']

        if 'email' in data:
            existing_email = User.query.filter_by(email=data['email']).first()
            if existing_email and existing_email.id != user_id:
                raise ValueError("Email already exists")
            user.email = data['email']

        if 'phone' in data:
            user.phone = data['phone']

        if 'deactivated' in data:
            user.deactivated = data['deactivated']

        if 'employee_id' in data:
            user.employee_id = data['employee_id']

        # Update password if provided
        if 'password' in data and len(data['password']) > 0:
            if not UserService.validate_password(data['password']):
                raise ValueError("Password must be at least 8 characeters and contain a number and uppercase and lowercase letters")
            user.set_password(data['password'])

        # Update role if provided (super_admin only operation)
        if 'role' in data:
            if data['role'] not in VALID_ROLES:
                raise ValueError(f"Invalid role. Must be one of: {', '.join(VALID_ROLES)}")
            user.role = data['role']

        try:
            db.session.commit()
            return user
        except Exception as e:
            db.session.rollback()
            raise Exception(f"Error updating user: {str(e)}")

    @staticmethod
    def delete_user(user_id: int) -> bool:
        """
        Delete a user

        Args:
            user_id: ID of user to delete

        Returns:
            Boolean indicating if deletion was successful
        """
        user = User.query.get(user_id)
        if not user:
            return False

        try:
            user.deactivated = True
            db.session.commit()
            return True
        except Exception as e:
            db.session.rollback()
            raise Exception(f"Error deleting user: {str(e)}")

    @staticmethod
    def validate_password(password: str) -> bool:
        """
        Validate password strength

        Args:
            password: Password to validate

        Returns:
            Boolean indicating if password meets requirements
        """
        # Example password requirements
        if len(password) < 8:
            return False
        if not any(c.isupper() for c in password):
            return False
        if not any(c.islower() for c in password):
            return False
        if not any(c.isdigit() for c in password):
            return False
        return True
