"""
Test CSV upload performance improvements
"""

import json
import requests

BASE_URL = 'http://127.0.0.1:5000/api'
USERNAME = 'office'
PASSWORD = 'office123'


def test_csv_upload_performance():
    """Test that large CSV uploads work efficiently"""
    print("\nTesting CSV Upload Performance")
    print("=" * 50)

    # Login
    login_response = requests.post(
        f'{BASE_URL}/auth/login',
        json={'username': USERNAME, 'password': PASSWORD},
        timeout=60,
    )

    if login_response.status_code != 200:
        print("❌ Login failed")
        return

    token = login_response.json()['access_token']
    print("✅ Login successful")

    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }

    # Create a table with CSV data (100 rows x 10 columns)
    print("\nCreating table with 100 rows × 10 columns...")

    num_rows = 100
    num_cols = 10

    # Generate test data
    columns = [
        {'name': f'Column {i}', 'data_type': 'text'}
        for i in range(num_cols)
    ]

    data_rows = [
        [f'Row{row}_Col{col}' for col in range(num_cols)]
        for row in range(num_rows)
    ]

    import time
    start_time = time.time()

    response = requests.post(
        f'{BASE_URL}/tables',
        headers=headers,
        json={
            'name': 'Performance Test Table',
            'tabs': [{
                'name': 'Test Tab',
                'columns': columns,
                'data': data_rows
            }]
        },
        timeout=120,
    )

    end_time = time.time()
    elapsed = end_time - start_time

    print(f"\nResponse status: {response.status_code}")
    print(f"Time taken: {elapsed:.2f} seconds")

    if response.status_code == 201:
        print(f"✅ Successfully created table with {num_rows} rows × {num_cols} columns")
        print(f"   Performance: {elapsed:.2f}s (should be < 10s for 100 rows)")

        # Verify the data
        table_id = response.json()['table_id']
        get_response = requests.get(
            f'{BASE_URL}/tables/{table_id}',
            headers=headers,
            timeout=60,
        )

        if get_response.status_code == 200:
            table_data = get_response.json()
            tab_data = table_data['table']['tabs'][0]['data']
            print(f"✅ Retrieved table data: {len(tab_data)} columns")

            # Check first column has correct number of rows
            if len(tab_data) > 0:
                first_col_data = tab_data[0]['data']
                print(f"✅ First column has {len(first_col_data)} rows")
                if len(first_col_data) == num_rows:
                    print("✅ Row count verified!")
                else:
                    print(f"❌ Expected {num_rows} rows, got {len(first_col_data)}")
        else:
            print("❌ Failed to retrieve table data")
    else:
        print(f"❌ Failed to create table: {response.text}")


if __name__ == '__main__':
    test_csv_upload_performance()
