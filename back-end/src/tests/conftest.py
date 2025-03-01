import pytest
import pickle
from sqlalchemy.orm import sessionmaker
from app import create_app, db as _db
from app.models.user import User
from app.models.checklist import ChecklistTemplate, Checklist
from flask_jwt_extended import create_access_token

@pytest.fixture(scope='session')
def app():
    """Create and configure a new app instance for testing"""
    app = create_app()
    app.config.update({
        'TESTING': True,
        'SQLALCHEMY_DATABASE_URI': 'postgresql://test:user@localhost/bakedinsights_test'
    })
    
    return app

@pytest.fixture(scope='session')
def db(app):
    """Session-wide test database"""
    with app.app_context():
        _db.drop_all()
        _db.create_all()
        
        # Create test users for different roles
        test_users = {
            'operator': User(username='test_operator', email='operator@test.com', 
                           employee_id='EMP001', role='operator'),
            'manager': User(username='test_manager', email='manager@test.com', 
                          employee_id='EMP002', role='manager'),
            'admin': User(username='test_admin', email='admin@test.com', 
                        employee_id='EMP003', role='admin'),
            'super_admin': User(username='test_super_admin', email='super_admin@test.com', 
                              employee_id='EMP004', role='super_admin')
        }
        
        # Set passwords for test users
        for user in test_users.values():
            user.set_password('password123')
            _db.session.add(user)
            
        _db.session.commit()
        
        yield _db
        
        # Cleanup
        _db.session.remove()
        _db.drop_all()

@pytest.fixture(scope='function')
def session(app, db):
    """Creates a new database session for each test"""
    with app.app_context():
        connection = db.engine.connect()
        transaction = connection.begin()
        
        # Create a session factory
        Session = sessionmaker(bind=connection)
        session = Session()
        
        # Start a nested transaction (using SAVEPOINT)
        nested = connection.begin_nested()
        
        # If the application code calls session.commit, it will end the nested
        # transaction. Need to start a new one when that happens.
        @db.event.listens_for(session, 'after_transaction_end')
        def end_savepoint(session, transaction):
            nonlocal nested
            if not nested.is_active:
                nested = connection.begin_nested()
        
        yield session
        
        # Rollback everything
        session.close()
        transaction.rollback()
        connection.close()

@pytest.fixture
def client(app):
    """Test client for API requests"""
    return app.test_client()

@pytest.fixture
def auth_tokens(app, db):
    """Generate JWT tokens for different user roles"""
    tokens = {}
    with app.app_context():
        users = User.query.all()
        for user in users:
            tokens[user.role] = create_access_token(
                identity=user.id,
                additional_claims={'role': user.role}
            )
    return tokens

@pytest.fixture
def test_users(app, db):
    """Return dictionary of test users"""
    with app.app_context():
        return {
            role: User.query.filter_by(role=role).first()
            for role in ['operator', 'manager', 'admin', 'super_admin']
        }