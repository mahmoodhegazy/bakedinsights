"""
Copyright (c) BakedInsights, Inc. and affiliates.
All rights reserved.
"""


from app import db
from app.models.tenant import TenantScopedModel
from werkzeug.security import check_password_hash, generate_password_hash


class User(TenantScopedModel):
    """
    User Model - Represents system users with different roles and permissions
    """
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), unique=False, nullable=False)
    username = db.Column(db.String(80), unique=False, nullable=False)
    email = db.Column(db.String(120), unique=False, nullable=False)
    phone = db.Column(db.String(20), unique=False, nullable=False)
    employee_id = db.Column(db.String(50), unique=False, nullable=False)
    password_hash = db.Column(db.String(256))
    role = db.Column(db.String(20), nullable=False)
    deactivated = db.Column(db.Boolean, nullable=False, default=False)

    # Composite unique constraint: (tenant_id, username)
    __table_args__ = (
        db.UniqueConstraint('tenant_id', 'username', name='uq_username_per_tenant'),
        db.UniqueConstraint('tenant_id', 'email', name='uq_email_per_tenant'),
        db.UniqueConstraint('tenant_id', 'phone', name='uq_phone_per_tenant'),
        db.UniqueConstraint('tenant_id', 'employee_id', name='uq_employee_id_per_tenant'),
    )

    def set_password(self, password):
        """Hash and set the user's password"""
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        """Verify the user's password"""
        return check_password_hash(self.password_hash, password)
