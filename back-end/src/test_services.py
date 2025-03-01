from app import create_app, db
from app.services.auth_service import AuthService
from app.services.checklist_service import ChecklistService
from app.services.table_service import TableService
from app.services.report_service import ReportService

app = create_app()

def test_services():
    with app.app_context():
        # Test authentication
        print("\nTesting Authentication...")
        auth_result = AuthService.login('admin', 'admin123')
        if auth_result:
            print("Authentication successful!")
            print(f"Token: {auth_result['access_token'][:30]}...")
        else:
            print("Authentication failed!")

        # Test checklist creation
        print("\nTesting Checklist Creation...")
        checklist_data = {
            'title': 'Test Checklist',
            'description': 'A test checklist',
            'items': [
                {
                    'description': 'Step 1',
                    'input_type': 'text',
                    'required': True
                },
                {
                    'description': 'Step 2',
                    'input_type': 'number',
                    'units': 'kg',
                    'required': True
                }
            ]
        }
        
        # Get super_admin user id
        from app.models.user import User
        admin = User.query.filter_by(username='admin').first()
        
        checklist = ChecklistService.create_checklist(checklist_data, admin.id)
        print(f"Checklist created with ID: {checklist.id}")

        # Test checklist assignment
        print("\nTesting Checklist Assignment...")
        operator = User.query.filter_by(username='operator').first()
        assignments = ChecklistService.assign_checklist(checklist.id, [operator.id])
        print(f"Checklist assigned to operator")

        print("\nAll tests completed successfully!")

if __name__ == '__main__':
    test_services()