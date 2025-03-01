"""
Copyright (c) BakedInsights, Inc. and affiliates.
All rights reserved.
"""


from app import db
from werkzeug.security import check_password_hash, generate_password_hash


class User(db.Model):
    """
    User Model - Represents system users with different roles and permissions

    Roles:
    - operator: Line operators who fill out checklists
    - manager: Supervisors who review and acknowledge checklist submissions
    - admin: Can create and assign checklists
    - super_admin: Has full system access including user management
    - office_staff: Can create and manage production record tables
    """
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), unique=False, nullable=False)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    phone = db.Column(db.String(20), unique=True, nullable=False)
    employee_id = db.Column(db.String(50), unique=True, nullable=False)
    password_hash = db.Column(db.String(256))
    role = db.Column(db.String(20), nullable=False)
    deactivated = db.Column(db.Boolean, nullable=False, default=False)

    def set_password(self, password):
        """Hash and set the user's password"""
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        """Verify the user's password"""
        return check_password_hash(self.password_hash, password)
