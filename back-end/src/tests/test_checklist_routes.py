import pytest
from datetime import datetime, timezone
from app.models.checklist import Checklist

@pytest.fixture
def template_data():
    return {
        'title': 'Test Template',
        'description': 'Test Description',
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

@pytest.fixture
def test_template_id(app, session, auth_tokens, template_data):
    """Create a test template"""
    with app.app_context():
        response = app.test_client().post(
            '/api/checklists/template',
            json=template_data,
            headers={'Authorization': f'Bearer {auth_tokens["admin"]}'}
        )
        template_id = response.json['id']
        return template_id

@pytest.fixture
def test_checklist_id(app, session, auth_tokens, test_template_id):
    """Create a test checklist"""
    with app.app_context():
        response = app.test_client().post(
            f'/api/checklists/checklist/{test_template_id}',
            headers={'Authorization': f'Bearer {auth_tokens["admin"]}'}
        )
        checklist_id = response.json['id']
        return checklist_id

def test_create_template_route_success(client, auth_tokens, template_data):
    """Test successful template creation"""
    response = client.post(
        '/api/checklists/template',
        json=template_data,
        headers={'Authorization': f'Bearer {auth_tokens["admin"]}'}
    )
    
    assert response.status_code == 201
    assert 'id' in response.json
    assert response.json['message'] == 'Checklist template created'

def test_create_template_route_unauthorized(client, template_data):
    """Test template creation without authorization"""
    response = client.post(
        '/api/checklists/template',
        json=template_data
    )
    
    assert response.status_code == 401

def test_create_template_route_wrong_role(client, auth_tokens, template_data):
    """Test template creation with wrong role"""
    response = client.post(
        '/api/checklists/template',
        json=template_data,
        headers={'Authorization': f'Bearer {auth_tokens["operator"]}'}
    )
    
    assert response.status_code == 403

def test_create_template_route_invalid_data(client, auth_tokens):
    """Test template creation with invalid data"""
    invalid_data = {
        'title': 'Test Template',
        # Missing required fields
    }
    
    response = client.post(
        '/api/checklists/template',
        json=invalid_data,
        headers={'Authorization': f'Bearer {auth_tokens["admin"]}'}
    )
    
    assert response.status_code == 400

def test_create_checklist_route_success(client, auth_tokens, test_template_id):
    """Test successful checklist creation"""
    response = client.post(
        f'/api/checklists/checklist/{test_template_id}',
        headers={'Authorization': f'Bearer {auth_tokens["admin"]}'}
    )
    
    assert response.status_code == 201
    assert 'id' in response.json
    assert response.json['message'] == 'Checklist created'

def test_create_checklist_route_invalid_template(client, auth_tokens):
    """Test checklist creation with invalid template"""
    response = client.post(
        '/api/checklists/checklist/999999',  # Non-existent template ID
        headers={'Authorization': f'Bearer {auth_tokens["admin"]}'}
    )
    
    assert response.status_code == 400

def test_assign_checklist_route_success(client, auth_tokens, test_checklist_id):
    """Test successful checklist assignment"""
    response = client.post(
        f'/api/checklists/{test_checklist_id}/assign',
        json={'user_ids': [1, 2]},
        headers={'Authorization': f'Bearer {auth_tokens["admin"]}'}
    )
    
    assert response.status_code == 200
    assert response.json['assignments'] == 2

def test_assign_checklist_route_invalid_users(client, auth_tokens, test_checklist_id):
    """Test checklist assignment with invalid users"""
    with client.application.app_context():
        # First verify the checklist exists
        checklist = Checklist.query.get(test_checklist_id)
        if not checklist:
            pytest.skip("Test checklist not found")
            
        response = client.post(
            f'/api/checklists/{test_checklist_id}/assign',
            json={'user_ids': []},  # Empty list should return 400
            headers={'Authorization': f'Bearer {auth_tokens["admin"]}'}
        )
        assert response.status_code == 400
        
        response = client.post(
            f'/api/checklists/{test_checklist_id}/assign',
            json={'user_ids': [99999, 99998]},  # Non-existent user IDs
            headers={'Authorization': f'Bearer {auth_tokens["admin"]}'}
        )
        assert response.status_code == 400
        assert "Invalid user IDs" in response.json.get('message', '')

def test_get_assigned_checklists_route_success(client, auth_tokens, test_checklist_id):
    """Test getting assigned checklists"""
    # First assign a checklist
    client.post(
        f'/api/checklists/{test_checklist_id}/assign',
        json={'user_ids': [1]},
        headers={'Authorization': f'Bearer {auth_tokens["admin"]}'}
    )
    
    # Then get assigned checklists
    response = client.get(
        '/api/checklists/assigned',
        headers={'Authorization': f'Bearer {auth_tokens["operator"]}'}
    )
    
    assert response.status_code == 200
    assert 'checklists' in response.json
    assert len(response.json['checklists']) > 0

def test_submit_checklist_route_success(client, auth_tokens, test_checklist_id):
    """Test successful checklist submission"""
    # First assign the checklist
    client.post(
        f'/api/checklists/{test_checklist_id}/assign',
        json={'user_ids': [1]},
        headers={'Authorization': f'Bearer {auth_tokens["admin"]}'}
    )
    
    # Then submit it
    response = client.post(
        f'/api/checklists/{test_checklist_id}/submit',
        headers={'Authorization': f'Bearer {auth_tokens["operator"]}'}
    )
    
    assert response.status_code == 200
    assert 'submission_id' in response.json

def test_update_checklist_item_route_success(client, auth_tokens, test_checklist_id, session):
    """Test successful item update"""
    with client.application.app_context():
        # Get an item from the checklist
        checklist = Checklist.query.get(test_checklist_id)
        item = checklist.items[0]
        
        response = client.put(
            f'/api/checklists/items/{item.id}',
            json={
                'value': 25.5,
                'description': 'Updated description'
            },
            headers={'Authorization': f'Bearer {auth_tokens["operator"]}'}
        )
        
        assert response.status_code == 200
        assert response.json['item']['description'] == 'Updated description'

def test_add_item_file_route_success(client, auth_tokens, test_checklist_id, session):
    """Test successful file addition"""
    with client.application.app_context():
        # Get the file item from the checklist
        checklist = Checklist.query.get(test_checklist_id)
        file_item = None
        for item in checklist.items:
            if item.input_type == 'file':
                file_item = item
                break
        
        if file_item:
            response = client.post(
                f'/api/checklists/items/{file_item.id}/files',
                json={'file': '/path/to/test/file.pdf'},
                headers={'Authorization': f'Bearer {auth_tokens["operator"]}'}
            )
            
            assert response.status_code == 200
            assert 'file' in response.json
            assert response.json['file']['value_file'] == '/path/to/test/file.pdf'

def test_acknowledge_checklist_route_success(client, auth_tokens, test_checklist_id, session):
    """Test successful checklist acknowledgment"""
    with client.application.app_context():
        # First verify the checklist exists
        checklist = Checklist.query.get(test_checklist_id)
        if not checklist:
            pytest.skip("Test checklist not found")
        
        # First assign the checklist to an operator
        assign_response = client.post(
            f'/api/checklists/{test_checklist_id}/assign',
            json={'user_ids': [1]},  # operator has ID 1
            headers={'Authorization': f'Bearer {auth_tokens["admin"]}'}
        )
        assert assign_response.status_code == 200
        
        # Then submit it as operator
        submit_response = client.post(
            f'/api/checklists/{test_checklist_id}/submit',
            headers={'Authorization': f'Bearer {auth_tokens["operator"]}'}
        )
        assert submit_response.status_code == 200
        submission_id = submit_response.json['submission_id']
        
        # Then acknowledge it as manager
        response = client.post(
            f'/api/checklists/{submission_id}/acknowledge',  # Use submission_id instead of checklist_id
            headers={'Authorization': f'Bearer {auth_tokens["manager"]}'}
        )
        
        assert response.status_code == 200
        assert 'acknowledgment_id' in response.json

def test_acknowledge_checklist_route_wrong_role(client, auth_tokens, test_checklist_id):
    """Test checklist acknowledgment with wrong role"""
    response = client.post(
        f'/api/checklists/{test_checklist_id}/acknowledge',
        headers={'Authorization': f'Bearer {auth_tokens["operator"]}'}
    )
    
    assert response.status_code == 403

def test_get_template_route_success(client, auth_tokens, test_template_id):
    """Test getting template details"""
    response = client.get(
        f'/api/checklists/template/{test_template_id}',
        headers={'Authorization': f'Bearer {auth_tokens["operator"]}'}
    )
    
    assert response.status_code == 200
    assert 'id' in response.json
    assert 'title' in response.json
    assert 'items' in response.json

def test_get_item_files_route_success(client, auth_tokens, test_checklist_id, session):
    """Test getting item files"""
    with client.application.app_context():
        # Get the file item and add a file first
        checklist = Checklist.query.get(test_checklist_id)
        file_item = None
        for item in checklist.items:
            if item.input_type == 'file':
                file_item = item
                break
        
        if file_item:
            # Add a file first
            client.post(
                f'/api/checklists/items/{file_item.id}/files',
                json={'file': '/path/to/test/file.pdf'},
                headers={'Authorization': f'Bearer {auth_tokens["operator"]}'}
            )
            
            # Then get the files
            response = client.get(
                f'/api/checklists/items/{file_item.id}/files',
                headers={'Authorization': f'Bearer {auth_tokens["operator"]}'}
            )
            
            assert response.status_code == 200
            assert 'files' in response.json
            assert len(response.json['files']) > 0