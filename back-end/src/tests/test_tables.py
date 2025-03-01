"""
Copyright (c) BakedInsights, Inc. and affiliates.
All rights reserved.
"""

import json

import requests

BASE_URL = 'http://127.0.0.1:5000/api'
USERNAME = 'office'
PASSWORD = 'office123'
UID = 3


def test_tables_login():
    """ Test login API """
    print("\nTesting login")
    print("-------------------------")

    # Login and get token
    login_response = requests.post(
        f'{BASE_URL}/auth/login',
        json={
            'username': USERNAME,
            'password': PASSWORD
        },
        timeout=60,  # timeout in seconds
    )
    token = login_response.json()['access_token']
    if login_response.status_code == 200:
        print(f"✅ Successfully loged in {token}")
    else:
        print("❌ Failed to login")

    return token


def test_create_table(token):
    """ Test create table API """
    print("\nTesting Create Table")
    print("-------------------------")

    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }

    test_response = requests.post(
        f'{BASE_URL}/tables',
        headers=headers,
        json={
            'name': 'Warehouse Intake',
            'tabs': [
                {
                    'name': 'Truck Deliveries',
                    'columns': [
                        {
                            'name': 'Truck Company',
                            'data_type': 'text',
                        },
                        {
                            'name': 'Truck ID',
                            'data_type': 'number',
                        },
                        {
                            'name': 'License File ',
                            'data_type': 'fpath',
                        },
                        {
                            'name': 'Was Checked',
                            'data_type': 'boolean',
                        },
                    ]
                },
                {
                    'name': 'Raw Materials',
                    'columns': [
                        {
                            'name': 'Coconut',
                            'data_type': 'number',
                        },
                        {
                            'name': 'Lythium',
                            'data_type': 'number',
                        },
                        {
                            'name': 'Hydrogn',
                            'data_type': 'number',
                        },
                    ]
                },
            ]
        },
        timeout=60,  # timeout in seconds
    )
    print("Test Response:")
    print(json.dumps(test_response.json(), indent=2))

    print(f"Response status: {test_response.status_code}")
    if test_response.status_code == 201:
        print("✅ Successfully created table")
    else:
        print("❌ Failed to create table")


def test_get_user_tables(token):
    """ Test get user's tables API """
    print("\nTesting get user tables")
    print("-------------------------")

    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }

    test_response = requests.get(
        f'{BASE_URL}/tables/user/{UID}',
        headers=headers,
        timeout=60,
    )

    print("Test Response:")
    print(json.dumps(test_response.json(), indent=2))

    print(f"Response status: {test_response.status_code}")
    if test_response.status_code == 200:
        print("✅ Successfully retrieved user tables")
    else:
        print("❌ Failed to retrieve item")


def test_get_table_tabs(token):
    """ Test get tabs for given table API """
    print("\nTesting get table tabs")
    print("-------------------------")

    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }

    test_response = requests.get(
        f'{BASE_URL}/tables/1/tabs',
        headers=headers,
        timeout=60,
    )

    print("Test Response:")
    print(json.dumps(test_response.json(), indent=2))

    print(f"Response status: {test_response.status_code}")
    if test_response.status_code == 200:
        print("✅ Successfully retrieved table tabs")
    else:
        print("❌ Failed to retrieve item")


def test_get_tab_data(token):
    """ Test get tab data API """
    print("\nTesting get tab data")
    print("-------------------------")

    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }

    test_response = requests.get(
        f'{BASE_URL}/tables/tabs/1/data',
        headers=headers,
        timeout=60,
    )

    print("Test Response:")
    print(json.dumps(test_response.json(), indent=2))

    print(f"Response status: {test_response.status_code}")
    if test_response.status_code == 200:
        print("✅ Successfully retrieved tab data")
    else:
        print("❌ Failed to retrieve item")


def test_update_table_data(token):
    """ Test update table data API """
    print("\nTesting update table data")
    print("-------------------------")

    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }

    test_response = requests.post(
        f'{BASE_URL}/tables/tabs/1/data',
        headers=headers,
        json={
            "updates": [
                {
                    "column_id": 4,
                    "row_index": 1,
                    "value": False
                },
                {
                    "column_id": 2,
                    "row_index": 2,
                    "value": 8202
                },
            ],
        },
        timeout=60,
    )

    print("Test Response:")
    print(json.dumps(test_response.json(), indent=2))

    print(f"Response status: {test_response.status_code}")
    if test_response.status_code == 201:
        print("✅ Successfully update table data")
    else:
        print("❌ Failed to update item")


def test_create_tab(token):
    """ Test create tab API """
    print("\nTesting create tab")
    print("-------------------------")

    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }

    test_response = requests.post(
        f'{BASE_URL}/tables/1/tabs',
        headers=headers,
        json={
            'name': 'UberEats Deliveries',
            'columns': [
                {
                    'name': 'Vendor',
                    'data_type': 'text',
                },
                {
                    'name': 'Price',
                    'data_type': 'number',
                },
            ]
        },
        timeout=60,
    )

    print("Test Response:")
    print(json.dumps(test_response.json(), indent=2))

    print(f"Response status: {test_response.status_code}")
    if test_response.status_code == 201:
        print("✅ Successfully created new tab")
    else:
        print("❌ Failed to create item")


def test_share_table(token):
    """ Test create tab API """
    print("\nTesting share tab")
    print("-------------------------")

    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }

    test_response = requests.post(
        f'{BASE_URL}/tables/1/share',
        headers=headers,
        json={
            "user_ids": [2],
        },
        timeout=60,
    )

    print("Test Response:")
    print(json.dumps(test_response.json(), indent=2))

    print(f"Response status: {test_response.status_code}")
    if test_response.status_code == 201:
        print("✅ Successfully shared new tab")
    else:
        print("❌ Failed to share item")


def run_tests():
    """ Run all unit tests """
    token = test_tables_login()
    # test_create_table(token)
    test_get_user_tables(token)
    test_get_table_tabs(token)
    # test_update_table_data(token)
    test_get_tab_data(token)
    # test_create_tab(token)
    test_share_table(token)


if __name__ == '__main__':
    run_tests()
