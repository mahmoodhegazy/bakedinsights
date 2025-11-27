"""
Copyright (c) BakedInsights, Inc. and affiliates.
All rights reserved.
"""

from typing import Dict, List

from app import db
from app.models.table import (Table, TableColumn, TableData, TableRecord,
                              TableShare, TableTab)
from app.utils import FileManager
from flask import g
from werkzeug.utils import secure_filename


class TableService:
    """ Table Service """

    @staticmethod
    def validate_user_for_record(user_id: int, record_id: int):
        """
        Check if user has access rights to column

        Args:
            user_id: ID of user requesting table
            record_id: ID of record user is requesting

        Returns:
            Boolean indicated whether user has right to access record_id
        """
        record = TableRecord.query.filter_by(id=record_id, tenant_id=g.tenant_id).first()
        if record:
            return TableService.validate_user_for_tab(user_id, record.tab_id)
        return True

    @staticmethod
    def validate_user_for_column(user_id: int, column_id: int):
        """
        Check if user has access rights to column

        Args:
            user_id: ID of user requesting table
            column_id: ID of column user is requesting

        Returns:
            Boolean indicated whether user has right to access column_id
        """
        column = TableColumn.query.filter_by(id=column_id, tenant_id=g.tenant_id).first()
        if column:
            return TableService.validate_user_for_tab(user_id, column.tab_id)
        return True

    @staticmethod
    def validate_user_for_tab(user_id: int, tab_id: int):
        """
        Check if user has access rights to tab

        Args:
            user_id: ID of user requesting table
            tab_id: ID of tab user is requesting

        Returns:
            Boolean indicated whether user has right to access table_id
        """
        table_id = TableTab.query.filter_by(id=tab_id, tenant_id=g.tenant_id).first().table_id
        return TableService.validate_user_for_table(user_id, table_id)

    @staticmethod
    def validate_user_for_table(user_id: int, table_id: int):
        """
        Check if user has access rights to table

        Args:
            user_id: ID of user requesting table
            table_id: ID of table user is requesting

        Returns:
            Boolean indicated whether user has right to access table_id
        """
        return table_id in [
            share.table_id
            for share in TableService.get_user_tables(user_id=user_id)
        ]

    @staticmethod
    def get_user_tables(user_id: int) -> List[Table]:
        """
        Get all tables shared with user

        Args:
            user_id: ID of user requesting tables

        Returns:
            List of Table instances shared with user
        """
        return TableShare.query.filter_by(user_id=user_id, tenant_id=g.tenant_id).all()

    @staticmethod
    def get_table(table_id: int):
        """
        Get table with given id

        Args:
            table_id: ID of table being request

        Returns:
            Table instances shared with user
        """
        return Table.query.filter_by(id=table_id, tenant_id=g.tenant_id).first()

    @staticmethod
    def get_table_shares(table_id: int):
        """
        Get table shares for given table-id

        Args:
            table_id: ID of table being request

        Returns:
            TableShare instances
        """
        return Table.query.filter_by(id=table_id, tenant_id=g.tenant_id).first().shares

    @staticmethod
    def get_table_tabs(table_id: int):
        """
        Get tabs for given table-id

        Args:
            table_id: ID of table for which we are requesitng tabs

        Returns:
            Tab instances shared with user
        """
        return Table.query.filter_by(id=table_id, tenant_id=g.tenant_id).first().tabs

    @staticmethod
    def get_column(column_id: int):
        """
        Get column with given id

        Args:
            col_id: ID of column being request

        Returns:
            Column instance
        """
        return TableColumn.query.filter_by(id=column_id, tenant_id=g.tenant_id).first()

    @staticmethod
    def get_tab(tab_id: int):
        """
        Get tab with given id

        Args:
            tab_id: ID of tab being request

        Returns:
            Tab instance
        """
        return TableTab.query.filter_by(id=tab_id, tenant_id=g.tenant_id).first()

    @staticmethod
    def get_tab_data(tab_id: int):
        """
        Get all data for given tab id

        Args:
            tab_id: ID of tab being request

        Returns:
            [column_data_i = {
                header: {column_id, column_name, column_data_type, column_index},
                data: {data_id, value, row_index}
            } for i in num. columns]

        """
        # Get columns
        column_data = []
        tab = TableTab.query.filter_by(id=tab_id, tenant_id=g.tenant_id).first()
        for c in tab.columns:
            data_type = c.data_type
            header = {
                "column_id": c.id,
                "column_name": c.name,
                "column_data_type": data_type,
            }
            # Get table data for each column
            table_data = []
            for t in c.table_data:
                value = None
                if data_type in ["text", "long-text"]:
                    value = t.value_text
                elif data_type == "number":
                    value = t.value_num
                elif data_type == "boolean":
                    value = t.value_bool
                elif data_type == "date":
                    value = t.value_date
                elif data_type == "file":
                    if t.value_fpath:
                        value = t.value_fpath \
                                + FileManager.PRESIGNED_URL_DEMARKATION \
                                + FileManager.get_file(t.value_fpath)
                elif data_type == "sku":
                    value = t.value_sku
                elif data_type == "lot-number":
                    value = t.value_lotnum
                elif data_type == "user":
                    value = t.value_user_id

                table_data.append({
                    "data_id": t.id,
                    "value": value,
                    "record_id": t.record_id,
                })

            column_data.append({
                "header": header,
                "data": table_data,
            })

        return column_data

    @staticmethod
    def delete_table_column(column_id: int) -> bool:
        """
        Delete a column

        Args:
            column_id: ID of column to delete

        Returns:
            Boolean indicating if deletion was successful
        """
        column = TableColumn.query.filter_by(id=column_id, tenant_id=g.tenant_id).first()
        if not column:
            return False

        try:
            # Delete data first, then column using bulk operations
            TableData.query.filter_by(column_id=column_id).delete(synchronize_session=False)
            TableColumn.query.filter_by(id=column_id).delete(synchronize_session=False)
            db.session.commit()
            return True
        except Exception as e:
            db.session.rollback()
            raise Exception(f"Error deleting column: {str(e)}")

    @staticmethod
    def delete_table(table_id: int) -> bool:
        """
        Delete a table

        Args:
            table_id: ID of table to delete

        Returns:
            Boolean indicating if deletion was successful
        """
        table = Table.query.filter_by(id=table_id, tenant_id=g.tenant_id).first()
        if not table:
            return False

        try:
            # Get tab IDs for bulk deletion
            tab_ids = [t.id for t in table.tabs]
            
            if tab_ids:
                # Delete in correct order using bulk DELETE statements (much faster)
                # 1. TableData (references records, columns, tabs)
                TableData.query.filter(TableData.tab_id.in_(tab_ids)).delete(synchronize_session=False)
                # 2. TableRecord (references tabs)
                TableRecord.query.filter(TableRecord.tab_id.in_(tab_ids)).delete(synchronize_session=False)
                # 3. TableColumn (references tabs)
                TableColumn.query.filter(TableColumn.tab_id.in_(tab_ids)).delete(synchronize_session=False)
            
            # 4. TableShare (references table)
            TableShare.query.filter_by(table_id=table_id).delete(synchronize_session=False)
            # 5. TableTab (references table)
            TableTab.query.filter_by(table_id=table_id).delete(synchronize_session=False)
            # 6. Table itself - use bulk delete to avoid stale session issues
            Table.query.filter_by(id=table_id).delete(synchronize_session=False)
            db.session.commit()
            return True
        except Exception as e:
            db.session.rollback()
            raise Exception(f"Error deleting table: {str(e)}")

    @staticmethod
    def delete_tab(tab_id: int) -> bool:
        """
        Delete a tab

        Args:
            tab_id: ID of tab to delete

        Returns:
            Boolean indicating if deletion was successful
        """
        tab = TableTab.query.filter_by(id=tab_id, tenant_id=g.tenant_id).first()
        if not tab:
            return False

        try:
            # Delete in correct order using bulk DELETE statements (much faster)
            # 1. TableData (references records, columns, tabs)
            TableData.query.filter_by(tab_id=tab_id).delete(synchronize_session=False)
            # 2. TableRecord (references tabs)
            TableRecord.query.filter_by(tab_id=tab_id).delete(synchronize_session=False)
            # 3. TableColumn (references tabs)
            TableColumn.query.filter_by(tab_id=tab_id).delete(synchronize_session=False)
            # 4. Tab itself - use bulk delete to avoid stale session issues
            TableTab.query.filter_by(id=tab_id).delete(synchronize_session=False)
            db.session.commit()
            return True
        except Exception as e:
            db.session.rollback()
            raise Exception(f"Error deleting tab: {str(e)}")

    @staticmethod
    def create_table(data: Dict, creator_id: int) -> Table:
        """
        Create a new table with columns and tabs

        Args:
            data: Dictionary containing table data
                {
                    name,
                    tabs: [{
                        name,
                        columns: [{
                            name,
                            data_type,
                        data: [[]]
                        } for num columns],
                    } for num tabs],
                }
            creator_id: ID of user creating the table

        Returns:
            Created Table instance
        """
        table = Table(
            name=data['name'].strip(),
            created_by=creator_id,
            tenant_id=g.tenant_id
        )

        share = TableShare(
            table_id=table.id,
            user_id=creator_id,
            tenant_id=g.tenant_id
        )
        table.shares.append(share)

        # Collect tabs with their columns and row data (no data copying)
        tabs_to_insert = []
        for i, tab_data in enumerate(data.get('tabs', [])):
            tab = TableTab(
                name=tab_data['name'].strip(),
                table_id=table.id,
                tab_index=i,
                tenant_id=g.tenant_id
            )
            table.tabs.append(tab)

            # Add columns (metadata only, no data copying)
            columns = []
            for col_data in tab_data.get('columns', []):
                column = TableColumn(
                    name=col_data['name'].strip(),
                    tab_id=tab.id,
                    data_type=col_data['data_type'],
                    tenant_id=g.tenant_id
                )
                tab.columns.append(column)
                columns.append(column)
            
            # Keep reference to original row data (no copying!)
            rows_data = tab_data.get("data", [])
            tabs_to_insert.append((tab, columns, rows_data))

        db.session.add(table)
        db.session.commit()

        # Store IDs and data BEFORE closing session
        table_id = table.id
        tabs_info = []
        for tab, columns, rows_data in tabs_to_insert:
            if not columns or not rows_data:
                continue
            # Copy rows_data to break any potential SQLAlchemy tracking
            tabs_info.append((tab.id, [c.id for c in columns], list(rows_data)))

        # Add cell data using optimized raw SQL bulk insert (32x faster than ORM)
        for tab_id, column_ids, rows_data in tabs_info:
            # Fetch fresh column info in new session (after commit above)
            fresh_columns = TableColumn.query.filter(TableColumn.id.in_(column_ids)).all()
            column_order = {cid: i for i, cid in enumerate(column_ids)}
            fresh_columns.sort(key=lambda c: column_order[c.id])

            # Use optimized bulk insert with raw psycopg2 execute_values
            TableService.bulk_insert_table_data(
                tab_id=tab_id,
                columns=fresh_columns,
                rows_data=rows_data,
            )

        # Return fresh table object
        return Table.query.get(table_id)

    @staticmethod
    def create_tab(data: Dict, table_id: int) -> Table:
        """
        Create a new tab with columns

        Args:
            data: Dictionary containing tab data
                {
                    name,
                    columns: [{
                        name,
                        data_type,
                    } for num columns]
                }

            creator_id: ID of user creating the table

        Returns:
            Created tab instance
        """
        tab_index = sum(1 for _ in TableService.get_table_tabs(table_id))

        # Add tabs
        tab = TableTab(
            name=data['name'].strip(),
            table_id=table_id,
            tab_index=tab_index,
            tenant_id=g.tenant_id,
        )

        # Add columns
        for col_data in data.get('columns', []):
            column = TableColumn(
                name=col_data['name'].strip(),
                tab_id=tab.id,
                data_type=col_data['data_type'],
                tenant_id=g.tenant_id,
            )
            tab.columns.append(column)

        db.session.add(tab)
        db.session.commit()
        return tab

    @staticmethod
    def update_table_column(column_id: int, updates: dict) -> TableColumn:
        """
        Update table column name and/or data type.
        Uses bulk SQL updates for data type changes to handle large tables efficiently.

        Args:
            column_id: ID of column being updated
            updates: dict with optional 'name' and 'data_type' keys

        Returns:
            Updated TableColumn instance
        """
        column = TableColumn.query.filter_by(id=column_id, tenant_id=g.tenant_id).first()
        if column:
            if "name" in updates:
                column.name = updates["name"].strip()

            if "data_type" in updates:
                prev_data_type = column.data_type
                new_data_type = updates["data_type"]
                
                if prev_data_type == 'file':
                    raise Exception("Cannot convert field of type 'file' to another format")
                if prev_data_type == 'user':
                    raise Exception("Cannot convert field of type 'user' to another format")
                if new_data_type == 'file':
                    raise Exception("Cannot convert an existing field to type 'file'")
                if new_data_type == 'user':
                    raise Exception("Cannot convert an existing field to type 'user'")
                
                if prev_data_type != new_data_type:
                    TableService._bulk_migrate_column_data(column_id, prev_data_type, new_data_type)
                
                column.data_type = new_data_type

        else:
            column = TableColumn(
                name=updates.get("name").strip(),
                data_type=updates.get("data_type"),
                tab_id=updates.get("tab_id"),
                tenant_id=g.tenant_id,
            )
            db.session.add(column)

        db.session.commit()
        return column

    @staticmethod
    def _bulk_migrate_column_data(column_id: int, prev_data_type: str, new_data_type: str):
        """
        Bulk migrate data values from one column type to another using raw SQL.
        This is much faster than ORM row-by-row updates for large tables.
        """
        from sqlalchemy import text
        
        source_column_map = {
            'text': 'value_text',
            'long-text': 'value_text',
            'number': 'value_num',
            'boolean': 'value_bool',
            'date': 'value_date',
            'sku': 'value_sku',
            'lot-number': 'value_lotnum',
        }
        
        dest_column_map = {
            'text': 'value_text',
            'long-text': 'value_text',
            'number': 'value_num',
            'boolean': 'value_bool',
            'date': 'value_date',
            'sku': 'value_sku',
            'lot-number': 'value_lotnum',
        }
        
        source_col = source_column_map.get(prev_data_type)
        dest_col = dest_column_map.get(new_data_type)
        
        if not source_col or not dest_col:
            return
        
        if source_col == dest_col:
            return
        
        if new_data_type == 'boolean':
            sql = text(f"""
                UPDATE table_data 
                SET {dest_col} = CASE 
                    WHEN LOWER(CAST({source_col} AS TEXT)) IN ('true', 'yes', '1') THEN TRUE 
                    ELSE FALSE 
                END,
                {source_col} = NULL
                WHERE column_id = :column_id
            """)
        else:
            sql = text(f"""
                UPDATE table_data 
                SET {dest_col} = CAST({source_col} AS TEXT),
                    {source_col} = NULL
                WHERE column_id = :column_id
            """)
        
        db.session.execute(sql, {'column_id': column_id})
        db.session.commit()

    @staticmethod
    def update_tab(tab_id: int, name: str) -> Table:
        """
        Update table info

        Args:
            tab_id: ID of tab being updated
            name: new tab name

        Returns:
            Updated TableTab instance
        """
        tab = TableTab.query.filter_by(id=tab_id, tenant_id=g.tenant_id).first()
        if not tab:
            return False

        tab.name = name.strip()
        db.session.commit()
        return tab

    @staticmethod
    def update_table(table_id: int, name: str) -> Table:
        """
        Update table info

        Args:
            table_id: ID of table being updated
            name: new table name

        Returns:
            Updated Table instance
        """
        table = Table.query.filter_by(id=table_id, tenant_id=g.tenant_id).first()
        if not table:
            return False

        table.name = name.strip()
        db.session.commit()
        return table

    @staticmethod
    def delete_table_record(record_id: int) -> TableRecord:
        """
        Delete table record and associated table data entries

        Args:
            record_id: id of table_record to be deleted

        Returns:
            Deleted TableRecord instance
        """
        record = TableRecord.query.filter_by(id=record_id, tenant_id=g.tenant_id).first()
        if record:
            # Delete data first, then record using bulk operations
            TableData.query.filter_by(record_id=record_id).delete(synchronize_session=False)
            TableRecord.query.filter_by(id=record_id).delete(synchronize_session=False)
            db.session.commit()
        return record

    @staticmethod
    def bulk_insert_table_data(
        tab_id: int,
        columns: List[TableColumn],
        rows_data: List[List],
    ) -> int:
        """
        Bulk insert table data for multiple rows (optimized for CSV upload)
        Uses raw psycopg2 execute_values for 30x+ performance improvement.

        Args:
            tab_id: ID of tab being updated
            columns: List of TableColumn instances (or dicts with 'id' and 'data_type')
            rows_data: List of rows, where each row is a list of values

        Returns:
            Number of rows inserted
        """
        from psycopg2.extras import execute_values

        if not rows_data:
            return 0

        tenant_id = g.tenant_id
        num_rows = len(rows_data)

        # Get raw psycopg2 connection from SQLAlchemy
        raw_conn = db.session.connection().connection
        cursor = raw_conn.cursor()

        try:
            # Bulk insert records using execute_values with RETURNING
            # IMPORTANT: page_size must be >= num_rows to get all IDs in one batch
            # Default page_size=100 would only return IDs from the last batch
            record_data = [(tab_id, tenant_id) for _ in range(num_rows)]
            execute_values(
                cursor,
                'INSERT INTO table_record (tab_id, tenant_id) VALUES %s RETURNING id',
                record_data,
                template='(%s, %s)',
                page_size=max(num_rows, 1000)  # Ensure all rows in one batch
            )
            record_ids = [row[0] for row in cursor.fetchall()]

            # Build column info for fast lookup (handle both objects and dicts)
            col_info = []
            for col in columns:
                if hasattr(col, 'id'):
                    col_info.append((col.id, col.data_type))
                else:
                    col_info.append((col['id'], col['data_type']))

            # Prepare all table data for bulk insert
            table_data_values = []
            for row_idx, row_values in enumerate(rows_data):
                record_id = record_ids[row_idx]

                for col_idx, (col_id, data_type) in enumerate(col_info):
                    if col_idx >= len(row_values):
                        continue

                    value = row_values[col_idx]
                    value_text, value_num, value_bool = None, None, None
                    value_date, value_fpath, value_sku = None, None, None
                    value_lotnum, value_user_id = None, None

                    if data_type in ['text', 'long-text']:
                        value_text = value
                    elif data_type == 'number':
                        try:
                            value_num = float(value) if value not in [None, ''] else None
                        except (ValueError, TypeError):
                            value_num = None
                    elif data_type == 'boolean':
                        value_bool = value in ["true", "True", "TRUE", True, "yes", "YES", "Yes"]
                    elif data_type == 'date':
                        value_date = value
                    elif data_type == 'file':
                        value_fpath = value
                        if hasattr(value, 'filename'):
                            value_fpath = FileManager.save_file_to_bucket(
                                filename=secure_filename(value.filename),
                                file=value
                            )
                    elif data_type == 'sku':
                        value_sku = value
                    elif data_type == 'lot-number':
                        value_lotnum = value
                    elif data_type == 'user':
                        value_user_id = value

                    table_data_values.append((
                        tab_id, col_id, record_id,
                        value_text, value_num, value_bool, value_date,
                        value_fpath, value_sku, value_lotnum, value_user_id,
                        tenant_id
                    ))

            # Bulk insert all table data
            if table_data_values:
                execute_values(
                    cursor,
                    '''INSERT INTO table_data 
                       (tab_id, column_id, record_id, value_text, value_num, value_bool, value_date,
                        value_fpath, value_sku, value_lotnum, value_user_id, tenant_id) 
                       VALUES %s''',
                    table_data_values,
                    page_size=1000
                )

            db.session.commit()
            return num_rows

        except Exception as e:
            db.session.rollback()
            raise Exception(f"Error in bulk insert: {str(e)}")

    @staticmethod
    def update_table_data(
        tab_id: int,
        record_id: int,
        updates: List[Dict],
    ) -> List[TableData]:
        """
        Update or create table data entries

        Args:
            tab_id: ID of tab being updated
            updates: List of data updates
                [{
                    column_id,
                    value,
                } for num updates]

        Returns:
            List of updated/created TableData instances
        """

        table_record = TableRecord.query.filter_by(id=record_id, tenant_id=g.tenant_id).first()
        if not table_record:
            table_record = TableRecord(
                tab_id=tab_id,
                tenant_id=g.tenant_id
            )
            db.session.add(table_record)
            db.session.commit()
        record_id = table_record.id

        # PERFORMANCE FIX: Batch fetch all columns and their data types in one query
        column_ids = [update['column_id'] for update in updates]
        columns = TableColumn.query.filter(
            TableColumn.id.in_(column_ids),
            TableColumn.tenant_id == g.tenant_id
        ).all()
        column_data_types = {col.id: col.data_type for col in columns}

        # PERFORMANCE FIX: Batch fetch all existing table data in one query
        existing_data = TableData.query.filter(
            TableData.tab_id == tab_id,
            TableData.record_id == record_id,
            TableData.column_id.in_(column_ids),
            TableData.tenant_id == g.tenant_id,
        ).all()
        existing_data_map = {data.column_id: data for data in existing_data}

        updated_data = []
        for update in updates:
            column_id = update['column_id']
            data_type = column_data_types.get(column_id)

            if not data_type:
                continue

            (
                value_text,
                value_num,
                value_bool,
                value_date,
                value_fpath,
                value_sku,
                value_lotnum,
                value_user_id,
            ) = None, None, None, None, None, None, None, None
            if data_type in ['text', 'long-text']:
                value_text = update['value']
            elif data_type == 'number':
                try:
                    value_num = float(update['value']) if update['value'] not in [None, ''] else None
                except (ValueError, TypeError):
                    value_num = None
            elif data_type == 'boolean':
                value_bool = update['value'] in ["true", "True", "TRUE", True]
            elif data_type == 'date':
                value_date = update['value']
            elif data_type == 'file':
                value_fpath = update['value']
                # If provided new file object, then upload to s3
                if hasattr(value_fpath, 'filename'):
                    value_fpath = FileManager.save_file_to_bucket(
                        filename=secure_filename(update['value'].filename),
                        file=update['value']
                    )
            elif data_type == 'sku':
                value_sku = update['value']
            elif data_type == 'lot-number':
                value_lotnum = update['value']
            elif data_type == 'user':
                value_user_id = update['value']

            table_data = existing_data_map.get(column_id)

            # Overwrite the entry in this table cell
            if table_data:
                # SC: If update type file may need to delete previous file from bucket
                if data_type == 'file' and table_data.value_fpath:
                    FileManager.delete_file_from_bucket(
                        filename=secure_filename(table_data.value_fpath)
                    )

                table_data.value_text = value_text
                table_data.value_num = value_num
                table_data.value_bool = value_bool
                table_data.value_date = value_date
                table_data.value_sku = value_sku
                table_data.value_lotnum = value_lotnum
                table_data.value_user_id = value_user_id
                table_data.value_fpath = value_fpath

            # Create new entry for table cell
            else:
                table_data = TableData(
                    tab_id=tab_id,
                    column_id=column_id,
                    record_id=record_id,
                    value_text=value_text,
                    value_num=value_num,
                    value_bool=value_bool,
                    value_date=value_date,
                    value_fpath=value_fpath,
                    value_sku=value_sku,
                    value_lotnum=value_lotnum,
                    value_user_id=value_user_id,
                    tenant_id=g.tenant_id,
                )
                db.session.add(table_data)

            updated_data.append(table_data)

        db.session.commit()

        return updated_data

    @staticmethod
    def share_table(acting_user_id: int, table_id: int, user_ids: List[int]) -> List[TableShare]:
        """
        Share table with multiple users

        Args:
            table_id: ID of table to share
            user_ids: List of user IDs to share table with

        Returns:
            List of created TableShare instances
        """
        shares = []
        # Share with new users
        for user_id in user_ids:
            share = TableShare.query.filter_by(table_id=table_id, user_id=user_id, tenant_id=g.tenant_id).first()
            if not share:
                share = TableShare(
                    table_id=table_id,
                    user_id=user_id
                )
                db.session.add(share)
                shares.append(share)

        # Unshare with removed users
        table = Table.query.filter_by(id=table_id, tenant_id=g.tenant_id).first()
        for share in table.shares:
            if share.user_id not in user_ids:
                if table.created_by == share.user_id:
                    continue
                if acting_user_id == share.user_id:
                    continue
                db.session.delete(share)

        db.session.commit()
        return shares
