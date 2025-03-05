# src/init_db.py
from datetime import datetime, time
from app import create_app, db
from app.models.user import User
from app.models.checklist import (ChecklistTemplate, ChecklistField,
                                ChecklistAssignment)
from app.models.table import (Table, TableTab, TableColumn, TableRecord,
                            TableData, TableShare)

app = create_app()

def init_db():
    with app.app_context():
        # Drop all tables and recreate them
        db.drop_all()
        db.create_all()

        # Create users
        users = {
            'super_admin': User(
                name='Super Admin',
                username='admin',
                email='admin@test.com',
                phone='123-456-7890',
                employee_id='EMP001',
                role='super_admin',
                deactivated=False
            ),
            'operator': User(
                name='Test Operator',
                username='operator',
                email='operator@test.com',
                phone='123-456-7891',
                employee_id='EMP002',
                role='staff',
                deactivated=False
            ),
            'staff': User(
                name='Test Staff',
                username='staff',
                email='staff@test.com',
                phone='123-456-7892',
                employee_id='EMP003',
                role='staff',
                deactivated=False
            )
        }

        # Set passwords
        for user in users.values():
            user.set_password('password123')
            db.session.add(user)

        db.session.commit()

        # Create checklist template
        template = ChecklistTemplate(
            title='Daily Production Checklist',
            description='Standard daily checks for production line',
            created_by=users['super_admin'].id,
            created_at=datetime.utcnow()
        )
        db.session.add(template)
        db.session.commit()

        # Create checklist fields
        fields = [
            ChecklistField(
                template_id=template.id,
                name='Equipment Check',
                description='Verify all equipment is operational',
                data_type='boolean',
                complete_by_time=time(hour=8, minute=0),
                order=0
            ),
            ChecklistField(
                template_id=template.id,
                name='Temperature Reading',
                description='Record current temperature in Celsius',
                data_type='number',
                complete_by_time=time(hour=9, minute=0),
                order=1
            ),
            ChecklistField(
                template_id=template.id,
                name='Batch Number',
                description='Enter current batch number',
                data_type='lot-number',
                complete_by_time=time(hour=9, minute=30),
                order=2
            )
        ]

        for field in fields:
            db.session.add(field)

        # Create checklist assignments
        assignment = ChecklistAssignment(
            template_id=template.id,
            user_id=users['operator'].id
        )
        db.session.add(assignment)

        # Create production records table
        table = Table(
            name='Production Records',
            created_by=users['super_admin'].id,
            created_at=datetime.utcnow()
        )
        db.session.add(table)
        db.session.commit()

        # Create table tab
        tab = TableTab(
            name='Daily Records',
            table_id=table.id,
            tab_index=0
        )
        db.session.add(tab)
        db.session.commit()

        # Create table columns
        columns = [
            TableColumn(
                name='Date',
                tab_id=tab.id,
                data_type='date'
            ),
            TableColumn(
                name='SKU',
                tab_id=tab.id,
                data_type='sku'
            ),
            TableColumn(
                name='Batch Number',
                tab_id=tab.id,
                data_type='lot-number'
            ),
            TableColumn(
                name='Quantity',
                tab_id=tab.id,
                data_type='number'
            ),
            TableColumn(
                name='QC Passed',
                tab_id=tab.id,
                data_type='boolean'
            ),
            TableColumn(
                name='Operator',
                tab_id=tab.id,
                data_type='user'
            )
        ]

        for column in columns:
            db.session.add(column)
        db.session.commit()

        # Create sample record
        record = TableRecord(
            tab_id=tab.id,
            created_at=datetime.utcnow()
        )
        db.session.add(record)
        db.session.commit()

        # Add sample data
        data = [
            TableData(
                tab_id=tab.id,
                column_id=columns[0].id,
                record_id=record.id,
                value_date=datetime.utcnow().date()
            ),
            TableData(
                tab_id=tab.id,
                column_id=columns[1].id,
                record_id=record.id,
                value_sku='SKU001'
            ),
            TableData(
                tab_id=tab.id,
                column_id=columns[2].id,
                record_id=record.id,
                value_lotnum='BATCH001'
            ),
            TableData(
                tab_id=tab.id,
                column_id=columns[3].id,
                record_id=record.id,
                value_num=100
            ),
            TableData(
                tab_id=tab.id,
                column_id=columns[4].id,
                record_id=record.id,
                value_bool=True
            ),
            TableData(
                tab_id=tab.id,
                column_id=columns[5].id,
                record_id=record.id,
                value_user_id=users['operator'].id
            )
        ]

        for item in data:
            db.session.add(item)

        # Share table with users
        shares = [
            TableShare(
                table_id=table.id,
                user_id=users['super_admin'].id,
                shared_at=datetime.utcnow()
            ),
            TableShare(
                table_id=table.id,
                user_id=users['operator'].id,
                shared_at=datetime.utcnow()
            ),
            TableShare(
                table_id=table.id,
                user_id=users['staff'].id,
                shared_at=datetime.utcnow()
            )
        ]

        for share in shares:
            db.session.add(share)

        db.session.commit()

        print("Database initialized with test data:")
        print("Users created (all with password 'password123'):")
        for user in users.values():
            print(f"- {user.username} ({user.role})")
        print("\nSample checklist template created:")
        print(f"- {template.title}")
        print("\nSample production records table created:")
        print(f"- {table.name}")

if __name__ == '__main__':
    init_db()
