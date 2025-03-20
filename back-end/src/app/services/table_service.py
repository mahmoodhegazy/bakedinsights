"""
Copyright (c) BakedInsights, Inc. and affiliates.
All rights reserved.
"""

from typing import Dict, List

from app import db
from app.models.table import (Table, TableColumn, TableData, TableRecord,
                              TableShare, TableTab)
from app.utils import FileManager
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
        record = TableRecord.query.get(record_id)
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
        column = TableColumn.query.get(column_id)
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
        table_id = TableTab.query.get(tab_id).table_id
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
        return TableShare.query.filter_by(user_id=user_id).all()

    @staticmethod
    def get_table(table_id: int):
        """
        Get table with given id

        Args:
            table_id: ID of table being request

        Returns:
            Table instances shared with user
        """
        return Table.query.get(table_id)

    @staticmethod
    def get_table_shares(table_id: int):
        """
        Get table shares for given table-id

        Args:
            table_id: ID of table being request

        Returns:
            TableShare instances
        """
        return Table.query.get(table_id).shares

    @staticmethod
    def get_table_tabs(table_id: int):
        """
        Get tabs for given table-id

        Args:
            table_id: ID of table for which we are requesitng tabs

        Returns:
            Tab instances shared with user
        """
        return Table.query.get(table_id).tabs

    @staticmethod
    def get_column(column_id: int):
        """
        Get column with given id

        Args:
            col_id: ID of column being request

        Returns:
            Column instance
        """
        return TableColumn.query.get(column_id)

    @staticmethod
    def get_tab(tab_id: int):
        """
        Get tab with given id

        Args:
            tab_id: ID of tab being request

        Returns:
            Tab instance
        """
        return TableTab.query.get(tab_id)

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
        tab = TableTab.query.get(tab_id)
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
        column = TableColumn.query.get(column_id)
        if not column:
            return False

        data = column.table_data
        try:
            for d in data:
                db.session.delete(d)
            db.session.commit()

            db.session.delete(column)
            db.session.commit()
            return True
        except Exception as e:
            db.session.rollback()
            raise Exception(f"Error deleting user: {str(e)}")

    @staticmethod
    def delete_table(table_id: int) -> bool:
        """
        Delete a table

        Args:
            table_id: ID of table to delete

        Returns:
            Boolean indicating if deletion was successful
        """
        table = Table.query.get(table_id)
        if not table:
            return False

        shares = table.shares
        tabs = table.tabs
        records, columns, data = [], [], []
        for t in tabs:
            records += t.records
            columns += t.columns
            data += t.table_data

        try:
            for s in shares:
                db.session.delete(s)
            for t in tabs:
                db.session.delete(t)
            for r in records:
                db.session.delete(r)
            for c in columns:
                db.session.delete(c)
            for d in data:
                db.session.delete(d)

            db.session.delete(table)
            db.session.commit()
            return True
        except Exception as e:
            db.session.rollback()
            raise Exception(f"Error deleting user: {str(e)}")

    @staticmethod
    def delete_tab(tab_id: int) -> bool:
        """
        Delete a tab

        Args:
            tab_id: ID of tab to delete

        Returns:
            Boolean indicating if deletion was successful
        """
        tab = TableTab.query.get(tab_id)
        if not tab:
            return False

        records = tab.records
        columns = tab.columns
        data = tab.table_data
        try:
            for d in data:
                db.session.delete(d)
            for r in records:
                db.session.delete(r)
            for c in columns:
                db.session.delete(c)

            db.session.delete(tab)
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
                        } for num columns]
                    } for num tabs],
                }
            creator_id: ID of user creating the table

        Returns:
            Created Table instance
        """
        table = Table(
            name=data['name'].strip(),
            created_by=creator_id
        )

        share = TableShare(
            table_id=table.id,
            user_id=creator_id,
        )
        table.shares.append(share)

        # Add tabs
        for i, tab_data in enumerate(data.get('tabs', [])):
            tab = TableTab(
                name=tab_data['name'].strip(),
                table_id=table.id,
                tab_index=i,
            )
            table.tabs.append(tab)

            # Add columns
            for col_data in tab_data.get('columns', []):
                column = TableColumn(
                    name=col_data['name'].strip(),
                    tab_id=tab.id,
                    data_type=col_data['data_type'],
                )
                tab.columns.append(column)

        db.session.add(table)
        db.session.commit()
        return table

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
        )

        # Add columns
        for col_data in data.get('columns', []):
            column = TableColumn(
                name=col_data['name'].strip(),
                tab_id=tab.id,
                data_type=col_data['data_type'],
            )
            tab.columns.append(column)

        db.session.add(tab)
        db.session.commit()
        return tab

    @staticmethod
    def update_table_column(column_id: int, updates: dict) -> TableColumn:
        """
        Update table info

        Args:
            table_id: ID of table being updated
            name: new table name

        Returns:
            Updated TableColumn instance
        """
        column = TableColumn.query.get(column_id)
        if column:
            if "name" in updates:
                column.name = updates["name"].strip()

            if "data_type" in updates:
                column.data_type = updates["data_type"]

        else:
            column = TableColumn(
                name=updates.get("name").strip(),
                data_type=updates.get("data_type"),
                tab_id=updates.get("tab_id"),
            )
            db.session.add(column)

        db.session.commit()
        return column

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
        tab = TableTab.query.get(tab_id)
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
        table = Table.query.get(table_id)
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
        record = TableRecord.query.get(record_id)
        if record:
            table_data = record.table_data
            for d in table_data:
                db.session.delete(d)
            db.session.delete(record)
            db.session.commit()
        return record

    @staticmethod
    def update_table_data(tab_id: int, record_id: int, updates: List[Dict]) -> List[TableData]:
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

        table_record = TableRecord.query.get(record_id)
        if not table_record:
            table_record = TableRecord(tab_id=tab_id)
            db.session.add(table_record)
            db.session.commit()
        record_id = table_record.id

        updated_data = []
        for update in updates:

            # Data type of the field being update
            data_type = TableColumn.query.get(update['column_id']).data_type
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
                value_num = update['value']
            elif data_type == 'boolean':
                value_bool = update['value'] in ["true", "True", "TRUE"]
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

            table_data = TableData.query.filter_by(
                tab_id=tab_id,
                column_id=update['column_id'],
                record_id=record_id,
            ).first()

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
                    column_id=update['column_id'],
                    record_id=record_id,
                    value_text=value_text,
                    value_num=value_num,
                    value_bool=value_bool,
                    value_date=value_date,
                    value_fpath=value_fpath,
                    value_sku=value_sku,
                    value_lotnum=value_lotnum,
                    value_user_id=value_user_id,
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
            share = TableShare.query.filter_by(table_id=table_id, user_id=user_id).first()
            if not share:
                share = TableShare(
                    table_id=table_id,
                    user_id=user_id
                )
                db.session.add(share)
                shares.append(share)

        # Unshare with removed users
        table = Table.query.get(table_id)
        for share in table.shares:
            if share.user_id not in user_ids:
                if table.created_by == share.user_id:
                    continue
                if acting_user_id == share.user_id:
                    continue
                db.session.delete(share)

        db.session.commit()
        return shares
