"""
Copyright (c) BakedInsights, Inc. and affiliates.
All rights reserved.
"""

from typing import Dict, List

from app import db
from app.models.checklist import (Checklist, ChecklistAssignment,
                                  ChecklistField, ChecklistItem,
                                  ChecklistTemplate)
from app.utils import FileManager
from werkzeug.utils import secure_filename


class ChecklistService:
    """ Checklist Service """

    @staticmethod
    def validate_user_for_item(user_id: int, item_id: int) -> bool:
        """
        Check if user has access rights to checklist item

        Args:
            user_id: ID of user requesting table
            item_id: ID of item user is requesting

        Returns:
            Boolean indicated whether user has right to access item_id
        """
        item = ChecklistItem.query.get(item_id)
        if item:
            return ChecklistService.validate_user_for_checklist(user_id, item.checklist_id)
        return False


    @staticmethod
    def validate_user_for_field(user_id: int, field_id: int) -> bool:
        """
        Check if user has access rights to template

        Args:
            user_id: ID of user requesting table
            field_id: ID of template user is requesting

        Returns:
            Boolean indicated whether user has right to access template_id
        """
        field = ChecklistField.query.get(field_id)
        if field:
            return ChecklistService.validate_user_for_template(user_id, field.template_id)
        return False


    @staticmethod
    def validate_user_for_checklist(user_id: int, checklist_id: int) -> bool:
        """
        Check if user has access rights to template

        Args:
            user_id: ID of user requesting table
            template_id: ID of template user is requesting

        Returns:
            Boolean indicated whether user has right to access template_id
        """
        checklist = Checklist.query.get(checklist_id)
        if checklist:
            return ChecklistService.validate_user_for_template(user_id, checklist.template.id)
        return False

    @staticmethod
    def validate_user_for_template(user_id: int, template_id: int) -> bool:
        """
        Check if user has access rights to template

        Args:
            user_id: ID of user requesting table
            template_id: ID of template user is requesting

        Returns:
            Boolean indicated whether user has right to access template_id
        """
        assignment = ChecklistAssignment.query.filter_by(user_id=user_id, template_id=template_id).first()
        if not assignment:
            return False
        return True

    @staticmethod
    def create_checklist_template(data: Dict, creator_id: int) -> ChecklistTemplate:
        """
        Create a new checklist template

        Args:
            data: Dictionary containing template data
            creator_id: ID of user creating the template

        Returns:
            Created ChecklistTemplate instance

        Raises:
            ValueError: If required fields missing or invalid
        """
        if not data.get("title"):
            raise ValueError("Title is required")

        template = ChecklistTemplate(
            title=data["title"],
            description=data.get("description", ""),
            created_by=creator_id
        )
        assignment = ChecklistAssignment(
            template_id=template.id,
            user_id=creator_id,
        )
        template.assignments.append(assignment)

        try:
            db.session.add(template)
            db.session.commit()
            return template
        except Exception as e:
            db.session.rollback()
            raise Exception(f"Error creating template: {str(e)}")

    @staticmethod
    def delete_template(template_id: int) -> ChecklistTemplate:
        """
        Delete a checklist template

        Args:
            template_id: ID of template to be deleted

        Returns:
            Delete ChecklistTempalte instance

        Raises:
            ValueError: If required fields missing or invalid
        """
        template = ChecklistTemplate.query.get(template_id)
        if not template:
            raise ValueError("Template not found")

        try:
            if len(template.checklists) > 0:
                if template.archived:
                    template.archived = False
                else:
                    template.archived = True
                db.session.add(template)
            else:
                for field in template.fields:
                    db.session.delete(field)
                for assignment in template.assignments:
                    db.session.delete(assignment)
                db.session.delete(template)

            db.session.commit()
            return template
        except Exception as e:
            db.session.rollback()
            raise Exception(f"Error deleting file: {str(e)}")

    @staticmethod
    def delete_field(field_id: int) -> ChecklistField:
        """
        Delete a field in a checklist template

        Args:
            field_id: ID of field to be deleted

        Returns:
            Delete ChecklistField instance

        Raises:
            ValueError: If required fields missing or invalid
        """
        field = ChecklistField.query.get(field_id)
        if not field:
            raise ValueError("Field not found")
        items = ChecklistItem.query.filter_by(field_id=field.id).all()

        try:
            for item in items:
                db.session.delete(item)
            db.session.commit()

            db.session.delete(field)
            db.session.commit()
            return field
        except Exception as e:
            db.session.rollback()
            raise Exception(f"Error deleting file: {str(e)}")

    @staticmethod
    def update_checklist_template(data: Dict) -> ChecklistTemplate:
        """
        Create a new checklist template

        Args:
            data: Dictionary containing template data
            creator_id: ID of user creating the template

        Returns:
            Created ChecklistTemplate instance

        Raises:
            ValueError: If required fields missing or invalid
        """
        template_id = data["id"]
        template = ChecklistTemplate.query.get(template_id)
        if not template:
            raise ValueError("Template not found")

        template.title = data.get("title", template.title)
        template.description = data.get("description", template.description)
        template.archived = data.get("archived", template.archived)

        if "fields" in data:
            for field_data in data["fields"]:

                data_type = field_data["data_type"]
                if data_type not in ["text", "number", "boolean", "lot-number", "sku"]:
                    raise ValueError("Invalid data type specified")

                complete_by_time = field_data["complete_by_time"]
                if not complete_by_time:
                    complete_by_time = None

                if "name" not in field_data or len(field_data["name"]) == 0:
                    raise ValueError("Must specify field name")

                name = field_data["name"]
                description = field_data["description"]
                order = field_data["order"]
                field_id = field_data["id"]

                if field_id < 0:
                    field = ChecklistField(
                        template_id=template_id,
                        name=name,
                        description=description,
                        data_type=data_type,
                        complete_by_time=complete_by_time,
                        order=order,
                    )
                    template.fields.append(field)
                else:
                    field = ChecklistField.query.get(field_id)
                    if not field:
                        raise ValueError("Invalid checklist field")
                    field.name = name
                    field.description = description
                    field.data_type = data_type
                    field.complete_by_time = complete_by_time
                    field.order = order
                    db.session.add(field)

        try:
            db.session.add(template)
            db.session.commit()
            return template
        except Exception as e:
            db.session.rollback()
            raise Exception(f"Error creating template: {str(e)}")

    @staticmethod
    def get_all_templates(user_id: int) -> List[Dict]:
        """Get checklist template by ID"""
        assignments = ChecklistAssignment.query.filter_by(user_id=user_id).all()
        results = []
        for assignment in assignments:
            template = assignment.template
            results.append({
                "id": template.id,
                "archived": template.archived,
                "title": template.title,
                "description": template.description,
                "created_by": template.created_by,
                "created_at": template.created_at.isoformat()
            })
        return results

    @staticmethod
    def get_template(template_id: int) -> Dict:
        """Get checklist template by ID"""
        template = ChecklistTemplate.query.get(template_id)
        has_checklists = len(template.checklists) > 0
        fields = [{
            "id": field.id,
            "name": field.name,
            "description": field.description,
            "data_type": field.data_type,
            "complete_by_time": field.complete_by_time.isoformat() if field.complete_by_time else None,
            "order": field.order,
        } for field in template.fields]
        return {
            "id": template.id,
            "title": template.title,
            "description": template.description,
            "archived": template.archived,
            "created_by": template.created_by,
            "created_at": template.created_at.isoformat(),
            "has_checklists": has_checklists,
            "fields": fields,
        }

    @staticmethod
    def create_checklist(template_id: int, creator_id: int) -> Checklist:
        """
        Create a new checklist instance from template

        Args:
            template_id: ID of template to use
            creator_id: ID of user creating the checklist

        Returns:
            Created Checklist instance

        Raises:
            ValueError: If template not found
        """
        template = ChecklistTemplate.query.get(template_id)
        if not template:
            raise ValueError("Template not found")

        checklist = Checklist(
            template_id=template_id,
            created_by=creator_id
        )
        fields = template.fields
        for field in fields:
            item = ChecklistItem(
                field_id=field.id,
                checklist_id=checklist.id,
            )
            checklist.items.append(item)

        template.checklists.append(checklist)

        try:
            db.session.add(template)
            db.session.commit()
            return checklist
        except Exception as e:
            db.session.rollback()
            raise Exception(f"Error creating checklist: {str(e)}")


    @staticmethod
    def get_user_checklists(user_id: int) -> List[Dict]:
        """
        Get all checklists assigned to user

        Args:
            user_id: ID of user to get assignments for

        Returns:
            List of dictionaries containing checklist info
        """
        assignments = ChecklistAssignment.query.filter_by(user_id=user_id).all()
        results = []
        for assignment in assignments:
            template = assignment.template
            num_tasks = len(template.fields)
            checklists = template.checklists
            for checklist in checklists:
                num_completed = 0
                for item in checklist.items:
                    field = ChecklistField.query.get(item.field_id)
                    data_type = field.data_type
                    value = None
                    if data_type == "text":
                        value = item.value_text
                    elif data_type == "number":
                        value = item.value_num
                    elif data_type == "boolean":
                        value = item.value_bool
                    elif data_type == "sku":
                        value = item.value_sku
                    elif data_type == "lot-number":
                        value = item.value_lotnum

                    if value is not None and value != "":
                        num_completed += 1

                results.append({
                    "id": checklist.id,
                    "archived": template.archived,
                    "template_id": template.id,
                    "template_name": template.title,
                    "created_by": checklist.created_by,
                    "created_at": checklist.created_at.isoformat(),
                    "submitted": checklist.submitted,
                    "num_tasks": num_tasks,
                    "num_completed": num_completed,
                })
        return results

    @staticmethod
    def get_checklist(checklist_id: int) -> Dict:
        """
        Get checklists with given checklist_id

        Args:
            checklist_id: ID of checklsit to retrieve

        Returns:
            Dictionary containing checklist info
        """
        checklist = Checklist.query.get(checklist_id)
        items = checklist.items
        results = []
        for item in items:
            field = ChecklistField.query.get(item.field_id)
            data_type = field.data_type

            value = None
            if data_type == "text":
                value = item.value_text
            elif data_type == "number":
                value = item.value_num
            elif data_type == "boolean":
                value = item.value_bool
            elif data_type == "sku":
                value = item.value_sku
            elif data_type == "lot-number":
                value = item.value_lotnum

            value_fpath = item.value_fpath
            if value_fpath:
                value_fpath = value_fpath \
                        + FileManager.PRESIGNED_URL_DEMARKATION \
                        + FileManager.get_file(value_fpath)

            results.append({
                "id": item.id,
                "field_id": item.field_id,
                "order": field.order,
                "data_type": data_type,
                "value": value,
                "value_fpath": value_fpath,
                "comment": item.comment,
                "completed_at": item.completed_at.isoformat() if item.completed_at else None,
                "submitted": checklist.submitted,
            })

        return results

    @staticmethod
    def delete_checklist(checklist_id: int) -> Checklist:
        """
        Delete a checklist

        Args:
            checklist_id: ID of checklist to be deleted

        Returns:
            Deleted Checklist instance

        Raises:
            ValueError: If required fields missing or invalid
        """
        checklist = Checklist.query.get(checklist_id)
        if not checklist:
            raise ValueError("Checklist not found")

        try:
            for item in checklist.items:
                db.session.delete(item)

            db.session.delete(checklist)
            db.session.commit()
            return checklist
        except Exception as e:
            db.session.rollback()
            raise Exception(f"Error deleting file: {str(e)}")


    @staticmethod
    def update_checklist_item(data: Dict, updated_by: int) -> ChecklistItem:
        """
        Update a checklist Item

        Args:
            data: Dictionary containing new item data
            updated_by: ID of user updating record

        Returns:
            Update ChecklistItem instance

        Raises:
            ValueError: If required fields missing or invalid
        """
        item_id = data["id"]
        item = ChecklistItem.query.get(item_id)
        if not item:
            raise ValueError("Item not found")

        field = ChecklistField.query.get(item.field_id)
        data_type = field.data_type
        (
            value_text,
            value_num,
            value_bool,
            value_sku,
            value_lotnum,
        ) = None, None, None, None, None
        if data_type == "text":
            value_text = data["value"]
        elif data_type == "number":
            value_num = float(data["value"])
        elif data_type == "boolean":
            value_bool = data['value'] in ["true", "True", "TRUE"]
        elif data_type == "sku":
            value_sku = data["value"]
        elif data_type == "lot-number":
            value_lotnum = data["value"]

        value_fpath = data.get("value_fpath")
        if hasattr(value_fpath, "filename"):  # if new file object, then upload to s3
            value_fpath = FileManager.save_file_to_bucket(
                filename=secure_filename(value_fpath.filename),
                file=value_fpath)
            if item.value_fpath:
                FileManager.delete_file_from_bucket(filename=secure_filename(item.value_fpath))
            item.value_fpath = value_fpath
        elif not value_fpath:
            if item.value_fpath:
                FileManager.delete_file_from_bucket(filename=secure_filename(item.value_fpath))
            item.value_fpath = value_fpath

        item.comment = data.get("comment")
        item.value_text = value_text
        item.value_num = value_num
        item.value_bool = value_bool
        item.value_sku = value_sku
        item.value_lotnum = value_lotnum
        item.updated_by = updated_by

        try:
            db.session.add(item)
            db.session.commit()
            return item
        except Exception as e:
            db.session.rollback()
            raise Exception(f"Error creating template: {str(e)}")

    @staticmethod
    def submit_checklist(checklist_id: int) -> Checklist:
        """
        Submit a checklist

        Args:
            checklist_id: ID of checklist to be submitted

        Returns:
            Deleted Checklist instance

        Raises:
            ValueError: If required fields missing or invalid
        """
        checklist = Checklist.query.get(checklist_id)
        if not checklist:
            raise ValueError("Checklist not found")

        checklist.submitted = True
        try:
            db.session.add(checklist)
            db.session.commit()
            return checklist
        except Exception as e:
            db.session.rollback()
            raise Exception(f"Error deleting file: {str(e)}")

    @staticmethod
    def share_template(acting_user_id: int, template_id: int, user_ids: List[int]) -> List[ChecklistAssignment]:
        """
        Share template with multiple users

        Args:
            template_id: ID of template to share
            user_ids: List of user IDs to share template with

        Returns:
            List of created ChecklistAssignment instances
        """
        shares = []
        # Share with new users
        for user_id in user_ids:
            share = ChecklistAssignment.query.filter_by(template_id=template_id, user_id=user_id).first()
            if not share:
                share = ChecklistAssignment(
                    template_id=template_id,
                    user_id=user_id
                )
                db.session.add(share)
                shares.append(share)

        # Unshare with removed users
        template = ChecklistTemplate.query.get(template_id)
        for share in template.assignments:
            if share.user_id not in user_ids:
                if template.created_by == share.user_id:
                    continue
                if acting_user_id == share.user_id:
                    continue
                db.session.delete(share)

        db.session.commit()
        return shares

    @staticmethod
    def get_template_shares(template_id: int):
        """
        Get template shares for given template-id

        Args:
            template_id: ID of template being request

        Returns:
            ChecklistAssignment instances
        """
        return ChecklistTemplate.query.get(template_id).assignments
