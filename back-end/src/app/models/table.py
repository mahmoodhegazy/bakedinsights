"""
Copyright (c) BakedInsights, Inc. and affiliates.
All rights reserved.
"""


from datetime import datetime

from app import db
from app.models.tenant import TenantScopedModel


class Table(TenantScopedModel):
    """
    Table Model - Represents production record tables created by office staff

    Tables can have multiple columns with different data types and multiple tabs
    Tables can be shared with other users
    """
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    created_by = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    tabs = db.relationship('TableTab', backref='table', lazy=True)
    shares = db.relationship('TableShare', backref='table', lazy=True)


class TableTab(TenantScopedModel):
    """
    TableTab Model - Represents different tabs within a table

    Allows organization of data into separate views/sheets
    """
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    table_id = db.Column(db.Integer, db.ForeignKey('table.id'), nullable=False)
    tab_index = db.Column(db.Integer, nullable=False)

    columns = db.relationship('TableColumn', backref='table_tab', lazy=True)
    records = db.relationship('TableRecord', backref='table_tab', lazy=True)
    table_data = db.relationship('TableData', backref='table_tab', lazy=True)


class TableColumn(TenantScopedModel):
    """
    TableColumn Model - Defines columns in production record tables

    Supports various data types including SKU, User, String, Number, etc.
    Maintains column order for display
    """
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    tab_id = db.Column(db.Integer, db.ForeignKey('table_tab.id'), nullable=False)
    data_type = db.Column(db.String(50), nullable=False)

    table_data = db.relationship('TableData', backref='table_column', lazy=True)

class TableRecord(TenantScopedModel):
    """
    TableRecord Model - Defines a single row (aka record) in a table

    Maintains TableData grouping for displaing rows
    """
    id = db.Column(db.Integer, primary_key=True)
    tab_id = db.Column(db.Integer, db.ForeignKey('table_tab.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    table_data = db.relationship('TableData', backref='table_record', lazy=True)

class TableData(TenantScopedModel):
    """
    TableData Model - Stores the actual data within tables

    Uses a flexible schema to store different types of data
    Links data to specific tabs, columns, and rows
    """
    id = db.Column(db.Integer, primary_key=True)
    tab_id = db.Column(db.Integer, db.ForeignKey('table_tab.id'), nullable=False)
    column_id = db.Column(db.Integer, db.ForeignKey('table_column.id'), nullable=False)
    record_id = db.Column(db.Integer, db.ForeignKey('table_record.id'), nullable=False)
    # --
    value_text = db.Column(db.Text, nullable=True)
    value_num = db.Column(db.Float, nullable=True)
    value_bool = db.Column(db.Boolean, nullable=True)
    value_date = db.Column(db.Date, nullable=True)
    value_fpath = db.Column(db.String(255), nullable=True)
    value_sku = db.Column(db.String(255), nullable=True)
    value_lotnum = db.Column(db.String(255), nullable=True)

    value_user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)


class TableShare(TenantScopedModel):
    """
    TableShare Model - Tracks table sharing between users

    Records when and with whom tables are shared
    """
    id = db.Column(db.Integer, primary_key=True)
    table_id = db.Column(db.Integer, db.ForeignKey('table.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    shared_at = db.Column(db.DateTime, default=datetime.utcnow)
