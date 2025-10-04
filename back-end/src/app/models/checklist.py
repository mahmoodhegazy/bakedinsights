"""
Copyright (c) BakedInsights, Inc. and affiliates.
All rights reserved.
"""


from datetime import datetime

from app import db
from app.models.tenant import TenantScopedModel


class ChecklistTemplate(TenantScopedModel):
    """
    ChecklistTemplate Model - Represents a template for production auditing checklists

    A checklist contains multiple items (steps) and can be assigned to multiple users
    It tracks creation details and maintains relationships with assignments and submissions
    """
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    created_by = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    archived = db.Column(db.Boolean, default=False, nullable=True)
    # --
    fields = db.relationship('ChecklistField', backref='template', lazy=True)
    checklists = db.relationship('Checklist', backref='template', lazy=True)
    assignments = db.relationship('ChecklistAssignment', backref='template', lazy=True)


class ChecklistField(TenantScopedModel):
    """
    ChecklistField - Represents a field in a checklist template
    """
    id = db.Column(db.Integer, primary_key=True)
    template_id = db.Column(db.Integer, db.ForeignKey('checklist_template.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=False)
    data_type = db.Column(db.String(50), nullable=False)
    complete_by_time = db.Column(db.Time, nullable=True)
    order = db.Column(db.Integer, nullable=False)


class Checklist(TenantScopedModel):
    """
    Checklist Model - Represents a checklist created from a template

    A checklist contains multiple items (steps) and can be assigned to multiple users
    It tracks creation details and maintains relationships with assignments and submissions
    """
    id = db.Column(db.Integer, primary_key=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    template_id = db.Column(db.Integer, db.ForeignKey('checklist_template.id'), nullable=False)
    created_by = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    submitted = db.Column(db.Boolean, nullable=True)
    # --
    items = db.relationship('ChecklistItem', backref='checklist', lazy=True)


class ChecklistItem(TenantScopedModel):
    """
    ChecklistItem Model - Represents individual steps/questions in a checklist

    Each item can have different input types (text, number, file) and optional units
    Items can have completion time requirements and ordering
    """
    id = db.Column(db.Integer, primary_key=True)
    field_id = db.Column(db.Integer, db.ForeignKey('checklist_field.id'), nullable=False)
    checklist_id = db.Column(db.Integer, db.ForeignKey('checklist.id'), nullable=False)
    # --
    value_text = db.Column(db.Text, nullable=True)
    value_num = db.Column(db.Float, nullable=True)
    value_bool = db.Column(db.Boolean, nullable=True)
    value_fpath = db.Column(db.String(255), nullable=True)
    value_sku = db.Column(db.String(255), nullable=True)
    value_lotnum = db.Column(db.String(255), nullable=True)
    comment = db.Column(db.Text, nullable=True)
    # --
    completed_at = db.Column(db.DateTime, onupdate=datetime.utcnow)
    updated_by = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)


class ChecklistAssignment(TenantScopedModel):
    """
    ChecklistAssignment Model - Links checklists to users they're assigned to

    Tracks when checklists are assigned and when they're scheduled to be completed
    """
    id = db.Column(db.Integer, primary_key=True)
    template_id = db.Column(db.Integer, db.ForeignKey('checklist_template.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    assigned_at = db.Column(db.DateTime, default=datetime.utcnow)
