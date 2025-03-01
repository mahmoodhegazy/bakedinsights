# tests/test_checklist_service.py
import pytest
import pickle
import codecs
from datetime import datetime, timezone
from app.services.checklist_service import ChecklistService

@pytest.fixture
def sample_template_data():
    return {
        'title': 'Daily Production Checklist',
        'description': 'Daily checks for production line',
        'recurrence': 'daily',
        'items': [
            {
                'description': 'Check temperature',
                'input_type': 'number',
                'units': 'celsius',
                'completion_time': datetime.now(timezone.utc).isoformat(),
                'required': True
            },
            {
                'description': 'Visual inspection',
                'input_type': 'text',
                'required': True
            }
        ]
    }

def test_create_checklist_template(app, session, sample_template_data):
    """Test creating a checklist template through service"""
    with app.app_context():
        template = ChecklistService.create_checklist_template(
            data=sample_template_data,
            creator_id=1
        )
        session.commit()  # Commit to make template available for other tests
        
        assert template.id is not None
        assert template.title == sample_template_data['title']
        assert template.description == sample_template_data['description']
        
        # Verify items were pickled correctly
        items = pickle.loads(codecs.decode(template.items.encode(), 'base64'))

        assert len(items) == len(sample_template_data['items'])
        assert items[0]['description'] == sample_template_data['items'][0]['description']
        
        return template  # Return for use in other tests

def test_create_checklist_from_template(app, session, sample_template_data):
    """Test creating a checklist instance from template"""
    with app.app_context():
        # First create template through service
        template_data = sample_template_data
        template = ChecklistService.create_checklist_template(
            data=template_data,
            creator_id=1
        )
        session.commit()
        
        # Then create checklist from template
        checklist = ChecklistService.create_checklist(
            template_id=template.id,
            creator_id=1
        )
        session.commit()
        
        assert checklist.id is not None
        assert checklist.template_id == template.id
        assert len(checklist.items) == len(template_data['items'])
        
        return checklist

def test_assign_checklist(app, session, sample_template_data):
    """Test assigning checklist to users"""
    with app.app_context():
        # Create template and checklist first
        template = test_create_checklist_template(app, session, sample_template_data)
        checklist = ChecklistService.create_checklist(template.id, 1)
        session.commit()
        
        assignments = ChecklistService.assign_checklist(
            checklist_id=checklist.id,
            user_ids=[1, 2, 3]
        )
        session.commit()
        
        assert len(assignments) == 3
        assert all(a.checklist_id == checklist.id for a in assignments)

def test_submit_checklist(app, session, sample_template_data):
    """Test submitting a checklist"""
    with app.app_context():
        # Create template and checklist first
        template = test_create_checklist_template(app, session, sample_template_data)
        checklist = ChecklistService.create_checklist(template.id, 1)
        session.commit()
        
        # Assign checklist to user
        ChecklistService.assign_checklist(checklist.id, [1])
        session.commit()
        
        submission = ChecklistService.submit_checklist(
            checklist_id=checklist.id,
            user_id=1
        )
        session.commit()
        
        assert submission.id is not None
        assert submission.checklist_id == checklist.id
        assert submission.submitted_by == 1

def test_update_checklist_item(app, session, sample_template_data):
    """Test updating a checklist item"""
    with app.app_context():
        # Create template and checklist with items
        template = test_create_checklist_template(app, session, sample_template_data)
        checklist = ChecklistService.create_checklist(template.id, 1)
        session.commit()
        
        # Get the first item
        item = checklist.items[0]
        
        updated_item = ChecklistService.update_checklist_item(
            item_id=item.id,
            data={
                'value': 25.5,
                'description': 'Updated description'
            }
        )
        session.commit()
        
        assert updated_item.description == 'Updated description'
        assert updated_item.value_number == 25.5
        assert updated_item.actual_completion_time is not None

def test_add_and_get_item_file(app, session):
    """Test adding, getting, deleting a file from checklist item"""
    with app.app_context():
        # Create template with a file item
        template_data = {
            'title': 'File Test Template',
            'description': 'Template with file item',
            'recurrence': 'daily',
            'items': [{
                'description': 'Upload file',
                'input_type': 'file',
                'required': True
            }]
        }
        
        template = ChecklistService.create_checklist_template(
            data=template_data,
            creator_id=1
        )
        session.commit()
        
        # Create checklist
        checklist = ChecklistService.create_checklist(template.id, 1)
        session.commit()
        
        # Get the file item
        file_item = checklist.items[0]
        
        file_entry = ChecklistService.add_item_file(
            item_id=file_item.id,
            file_path='/path/to/test/file.pdf'
        )
        session.commit()
        
        assert file_entry.id is not None
        assert file_entry.item_id == file_item.id
        assert file_entry.value_file == '/path/to/test/file.pdf'
        
        # Get files
        files = ChecklistService.get_item_files(file_entry.item_id)

        assert len(files) == 1
        assert files[0].value_file == '/path/to/test/file.pdf'
        assert files[0].item_id == file_entry.item_id

        # Delete file
        ChecklistService.delete_item_file(file_entry.id)
        # Verify file is deleted
        files = ChecklistService.get_item_files(file_entry.item_id)
        assert len(files) == 0