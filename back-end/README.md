# BakedInsights Backend

## App Info

### Request Flow:

```python
Client Request → Route → Service Layer → Model → Database
Response ← Route ← Service Layer ← Model ← Database
```

1. Client sends request (ex. POST request to /api/auth/login)
2. Route handles request 
3. Service processes logic
4. Model interacts with database
5. Response returns to client

### Login Process:

1. User sends credentials
2. Server validates and returns JWT token
3. Client stores token
4. Token sent with subsequent requests


## Project structure:

**a. Blueprints (routes):**

Flask's way of organizing routes (request handling) into modules
Each feature has its own blueprint (auth, users, checklists)

**b. Models:**

Python classes that represent database tables
Handle data validation and relationships

**c. Services:**

Business logic layer
Keeps routes clean and logic reusable

**d. JWT Authentication:**

Stateless authentication using tokens
Each request includes token in header


## System Requirements

- Python 3.11 or higher
- conda package manager

## Installation Guide

### 1. Python Environment Setup

```bash
# Clone the repository
git clone <repository-url>
cd bakedinights

# Create and activate virtual environment
conda env create -f environment.yml
conda activate backend
```

### 2. Database Setup (PostgreSQL)

PostgreSQL is already installed your conda environment. Now we will create a local database for development.
```bash
# Create a PostgresSQL database in a directory called "mylocal_db"
initdb -D mylocal_db

# Start the database server and put all server logs in a file called "logfile"
pg_ctl -D mylocal_db -l logfile start
```

Next, create a psql aministrator user, and create the database for the app, which we will call "bakedinsights"

Create database and a user:
```bash
# Connect to PostgreSQL
psql postgres

# In PostgreSQL console
CREATE USER username WITH PASSWORD ;password';
ALTER USER username WITH SUPERUSER;
CREATE DATABASE bakedinsights;
GRANT ALL PRIVILEGES ON DATABASE bakedinsights TO username;

# Exit PostgreSQL console
\q
```

### 3. Application Configuration

Make sure your `config.py` has the correct database URI:
```python
class Config:
    SECRET_KEY = 'your-secret-key'  # Change this!
    SQLALCHEMY_DATABASE_URI = 'postgresql://username:password@localhost/bakedinights'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = 'jwt-secret-key'  # Change this!
```

### 4. Initialize Database

```bash
# From the src directory
python init_db.py
```

This will create:
- Super Admin user (username: admin, password: admin123)
- Test Operator user (username: operator, password: operator123)

### 5. Run the Application

```bash
# From the src directory
python run.py
```

The application will be available at `http://localhost:5000`

## Project Structure

```
src/
├── config.py                 # Configuration settings
├── init_db.py               # Database initialization
├── run.py                   # Application entry point
└── app/
    ├── __init__.py          # App initialization
    ├── models/              # Database models
    │   ├── user.py
    │   ├── checklist.py
    │   └── table.py
    ├── routes/              # API endpoints
    │   ├── auth.py
    │   ├── users.py
    │   ├── checklists.py
    │   └── tables.py
    └── services/            # Business logic
        ├── auth_service.py
        ├── user_service.py
        ├── checklist_service.py
        └── table_service.py
```

## API Testing

You can test the API endpoints using curl or Postman:

### Authentication

```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'
```

### User Management

```bash
# Get all users (requires JWT token)
curl -X GET http://localhost:5000/api/users \
  -H "Authorization: Bearer <your_token>"

# Create new user (super_admin only)
curl -X POST http://localhost:5000/api/users \
  -H "Authorization: Bearer <your_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "email": "john@example.com",
    "employee_id": "EMP123",
    "password": "SecurePass123",
    "role": "operator"
  }'
```
