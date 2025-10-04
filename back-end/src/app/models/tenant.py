"""
Copyright (c) BakedInsights, Inc. and affiliates.
All rights reserved.
"""

from app import db
from sqlalchemy.ext.declarative import declared_attr


class TenantScopedModel(db.Model):
    """ Abstract table class enforcing RLS based on tenant_id """

    __abstract__ = True

    @declared_attr
    def tenant_id(cls):
        return db.Column(db.Integer, db.ForeignKey('tenant.id'), nullable=False)


class Tenant(db.Model):
    """
    Tenant Model - Represents different tenents (organizations/sites)
    """
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, nullable=False)
