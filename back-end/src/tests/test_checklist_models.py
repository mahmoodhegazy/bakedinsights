import pytest
import pickle
import codecs
from datetime import datetime, timezone
from app.models.checklist import (
    ChecklistTemplate, Checklist, ChecklistItem,
    ChecklistAssignment, ChecklistSubmission, ChecklistItemFile,
    ChecklistAcknowledgment
)

@pytest.fixture
def test_template(app, session):
    """Create a test template for checklist tests"""
    with app.app_context():
        template = ChecklistTemplate(
            title='Test Template',
            description='Test Description',
            recurrence='daily',
            items=codecs.encode(pickle.dumps([{
                'description': 'Test Item',
                'input_type': 'number',
                'units': 'celsius',
                'completion_time': datetime.now(timezone.utc).isoformat(),
                'required': True
            }]), encoding="base64").decode(),
            created_by=1
        )
        session.add(template)
        session.flush()
        return template

@pytest.fixture
def test_checklist(app, session, test_template):
    """Create a test checklist for item tests"""
    with app.app_context():
        checklist = Checklist(
            created_by=1,
            template_id=test_template.id
        )
        session.add(checklist)
        session.flush()
        return checklist

def test_checklist_template_creation(app, session):
    """Test creating a checklist template"""
    with app.app_context():
        template = ChecklistTemplate(
            title='Test Template',
            description='Test Description',
            recurrence='daily',
            items=codecs.encode(pickle.dumps([{
                'description': 'Test Item',
                'input_type': 'number',
                'units': 'celsius',
                'completion_time': datetime.now(timezone.utc).isoformat(),
                'required': True
            }]), encoding="base64").decode(),
            created_by=1
        )
        
        session.add(template)
        session.flush()
        
        assert template.id is not None
        assert template.title == 'Test Template'
        assert template.recurrence == 'daily'
        assert template.created_by == 1
        
        # Verify items can be unpickled
        items = pickle.loads(codecs.decode(template.items.encode(), 'base64'))
        assert isinstance(items, list)
        assert items[0]['description'] == 'Test Item'

def test_checklist_creation(app, session, test_template):
    """Test creating a checklist from template"""
    with app.app_context():
        checklist = Checklist(
            created_by=1,
            template_id=test_template.id
        )
        session.add(checklist)
        session.flush()
        
        assert checklist.id is not None
        assert checklist.template_id == test_template.id
        assert checklist.created_by == 1

def test_checklist_item_creation(app, session, test_checklist):
    """Test creating checklist items"""
    with app.app_context():
        item = ChecklistItem(
            checklist_id=test_checklist.id,
            description='Test Item',
            input_type='number',
            units='celsius',
            required=True,
            order=1
        )
        session.add(item)
        session.flush()
        
        assert item.id is not None
        assert item.checklist_id == test_checklist.id
        assert item.input_type == 'number'
        assert item.required is True

def test_checklist_assignment(app, session, test_checklist):
    """Test checklist assignment"""
    with app.app_context():
        assignment = ChecklistAssignment(
            checklist_id=test_checklist.id,
            user_id=1
        )
        session.add(assignment)
        session.flush()
        
        assert assignment.id is not None
        assert assignment.checklist_id == test_checklist.id
        assert assignment.user_id == 1
        assert assignment.assigned_at is not None

def test_checklist_submission(app, session, test_checklist):
    """Test checklist submission"""
    with app.app_context():
        submission = ChecklistSubmission(
            checklist_id=test_checklist.id,
            submitted_by=1,
            completed_tasks=5,
            has_delays=False
        )
        session.add(submission)
        session.flush()
        
        assert submission.id is not None
        assert submission.checklist_id == test_checklist.id
        assert submission.submitted_by == 1
        assert submission.completed_tasks == 5
        assert submission.has_delays is False

def test_checklist_item_file(app, session, test_checklist):
    """Test checklist item file attachment"""
    with app.app_context():
        # Create item first
        item = ChecklistItem(
            checklist_id=test_checklist.id,
            description='File Test Item',
            input_type='file',
            required=True,
            order=1
        )
        session.add(item)
        session.flush()
        
        # Add file to item
        file_entry = ChecklistItemFile(
            item_id=item.id,
            value_file='/path/to/test/file.pdf'
        )
        session.add(file_entry)
        session.flush()
        
        assert file_entry.id is not None
        assert file_entry.item_id == item.id
        assert file_entry.value_file == '/path/to/test/file.pdf'
        assert file_entry.completed_at is not None

def test_checklist_acknowledgment(app, session, test_checklist):
    """Test checklist acknowledgment"""
    with app.app_context():
        # Create submission first
        submission = ChecklistSubmission(
            checklist_id=test_checklist.id,
            submitted_by=1,
            completed_tasks=5,
            has_delays=False
        )
        session.add(submission)
        session.flush()
        
        # Create acknowledgment
        acknowledgment = ChecklistAcknowledgment(
            submission_id=submission.id,
            user_id=2  # Manager/supervisor ID
        )
        session.add(acknowledgment)
        session.flush()
        
        assert acknowledgment.id is not None
        assert acknowledgment.submission_id == submission.id
        assert acknowledgment.user_id == 2
        assert acknowledgment.acknowledged_at is not None

def test_checklist_relationships(app, session, test_template):
    """Test relationships between checklist models"""
    with app.app_context():
        # Create checklist
        checklist = Checklist(created_by=1, template_id=test_template.id)
        session.add(checklist)
        session.flush()  # Ensure checklist has an ID
        
        # Add items
        item1 = ChecklistItem(
            checklist_id=checklist.id,
            description='Item 1',
            input_type='text',
            required=True,
            order=1
        )
        item2 = ChecklistItem(
            checklist_id=checklist.id,
            description='Item 2',
            input_type='number',
            required=True,
            order=2
        )
        session.add_all([item1, item2])
        session.flush()  # Flush to ensure items have IDs
        
        # Create and flush assignment separately
        assignment = ChecklistAssignment(
            checklist_id=checklist.id,
            user_id=1
        )
        session.add(assignment)
        session.flush()
        
        # Refresh the checklist object to ensure relationships are loaded
        session.refresh(checklist)
        
        # Test relationships
        assert len(checklist.items) == 2
        assert checklist.template == test_template
        assert len(checklist.assignments) == 1
        assert checklist.assignments[0].user_id == 1
        
        # Test item relationships
        assert checklist.items[0].description == 'Item 1'
        assert checklist.items[1].description == 'Item 2'
        
        # Test assignment relationship
        assert checklist.assignments[0].checklist_id == checklist.id
        
        # Test template relationship
        assert checklist.template.id == test_template.id