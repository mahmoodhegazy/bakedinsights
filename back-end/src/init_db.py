"""
Copyright (c) BakedInsights, Inc. and affiliates.
All rights reserved.
"""

from app import create_app, db
from app.models.tenant import Tenant
from app.models.user import User

app = create_app()

def init_db():
    """ Initialize the database Admin User """

    with app.app_context():
        # Drop all tables and recreate them
        db.drop_all()
        db.create_all()

        tenant_1 = Tenant(name="Le Cafe Pick-Me-Up")
        tenant_2 = Tenant(name="Le Cafe Pick-Me-Up")
        db.session.add(tenant_1)
        db.session.add(tenant_2)
        db.session.commit()

        # Create users
        users = {
            'first-super_admin': User(
                tenant_id=tenant_1.id,
                name='Super Admin',
                username='admin',
                email='midostuf@hotmail.com',
                phone='514-123-4567',
                employee_id='EMP001',
                role='super_admin',
                deactivated=False
            ),
            'first-admin': User(
                tenant_id=tenant_1.id,
                name='Admin',
                username='fadmin',
                email='fadmin@test.com',
                phone='514-123-4569',
                employee_id='EMP002',
                role='admin',
                deactivated=False
            ),
            'admin': User(
                tenant_id=tenant_1.id,
                name='Admin',
                username='radmin',
                email='admin@test.com',
                phone='514-123-4563',
                employee_id='EMP003',
                role='admin',
                deactivated=False
            ),
            'staff': User(
                tenant_id=tenant_1.id,
                name='Staff',
                username='staff',
                email='staff@test.com',
                phone='514-123-4562',
                employee_id='EMP004',
                role='staff',
                deactivated=False
            ),
            'super_admin': User(
                tenant_id=tenant_2.id,
                name='Super Admin',
                username='admin',
                email='sec-admin@test.com',
                phone='514-123-4561',
                employee_id='EMP001',
                role='super_admin',
                deactivated=False
            ),

        }
        # Set passwords
        for user in users.values():
            user.set_password('Admin123')
            db.session.add(user)

        db.session.commit()

        print("Database initialized with test data:")
        print("Users created (all with password 'Admin123'):")
        for user in users.values():
            print(f"- {user.username} ({user.role}) (tenant: {user.tenant_id})")

if __name__ == '__main__':
    init_db()
