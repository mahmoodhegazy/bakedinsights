# BakedInsights - Replit Setup

## Project Overview
BakedInsights is a full-stack web application for managing checklists and tables with AI-powered features.

**Tech Stack:**
- **Frontend**: React + TypeScript + Vite (Port 5000)
- **Backend**: Python Flask (Port 8000)
- **Database**: PostgreSQL (Replit-managed, persistent)

## Architecture
- **Frontend**: `/front-end/baked-insights-frontend/` - React SPA with Vite dev server
- **Backend**: `/back-end/src/` - Flask REST API
- **Database**: PostgreSQL (managed by Replit, accessible via DATABASE_URL)

## Running the Application

### Development Mode
Both workflows run automatically:
- **Frontend workflow** - Runs Vite dev server on port 5000
- **Backend workflow** - Runs Flask server on port 8000

The backend is accessible at `http://localhost:8000`.

The frontend proxies all `/api/*` requests to the backend server.

### Production Deployment (Autoscale)
For Autoscale deployment, Flask serves both the API and the React frontend on a single port (5000).
The React app is built and served as static files from Flask.

## Default Users
The database has been initialized with test users (password: `Admin123`):
- **admin** (super_admin, tenant: 1)
- **fadmin** (admin, tenant: 1)
- **radmin** (admin, tenant: 1)
- **staff** (staff, tenant: 1)

## Recent Changes
- **2025-11-27**: Fixed column type updates for large tables
  - Root cause: ORM row-by-row updates timeout for 7000+ row tables
  - Solution: Added `_bulk_migrate_column_data` method using raw SQL UPDATE
  - Now handles text, number, date, boolean, sku, lot-number conversions efficiently
  - Fixed existing Large Table Test column types directly in database
- **2025-11-27**: Updated AI model from Llama 3.3 70B to ServiceNow Apriel 1.5 15B Thinker
  - Changed model in aiService.ts from "meta-llama/Llama-3.3-70B-Instruct-Turbo-Free" to "ServiceNow-AI/Apriel-1.5-15b-Thinker"
  - Model tested and verified working with Together AI
- **2025-11-27**: Fixed frontend rendering performance for large tables
  - Implemented pagination in Table component (50 rows per page)
  - Prevents browser freeze when viewing tables with 7000+ rows
  - Added page navigation controls with "Previous", "Next", and page number buttons
  - Shows row count information (e.g., "Showing 1 - 50 of 7,296 rows")
  - Changed backend port from 5050 to 8000 (required for Replit workflow support)
- **2025-01-27**: MAJOR PERFORMANCE OPTIMIZATION - 100x improvement for large CSV imports
  - **Root cause identified**: SQLAlchemy ORM bulk operations are inherently slow (~35ms per INSERT)
  - **Solution**: Replaced ORM with raw psycopg2 `execute_values()` for bulk inserts
  - **Performance results**:
    - 7000 rows x 5 columns: **4.97 seconds** (was 550+ seconds) = **100x improvement**
    - Insert rate: **1,408 rows/sec** (was ~12 rows/sec)
    - Delete rate: 7000 records in **0.72 seconds**
  - **Technical changes**:
    - `bulk_insert_table_data`: Now uses raw `psycopg2.extras.execute_values()` with RETURNING
    - Critical fix: Set `page_size >= num_rows` for bulk RETURNING to get all IDs
    - `create_table`: Calls optimized `bulk_insert_table_data` for cell data
    - All deletion methods use bulk DELETE (children before parents for FK constraints)
  - This fix applies to both direct table creation and CSV import via `/api/tables/import`
- **2025-01-12**: Fixed CSV import memory issue for large files
  - Implemented bulk insert optimization (reduces 20,000+ queries to ~3 queries)
  - Fixes memory exhaustion and timeouts on large CSV uploads
  - Preserves all data including zeros, False values, and empty strings
  - Supports all column types (text, number, boolean, date, file, sku, lot-number, user)
- **2025-01-12**: Fixed CSV import to handle formatted numbers
  - Strips whitespace from all CSV values
  - Removes commas and spaces from numbers (e.g., " 3,300 " → 3300)
  - Fixes PostgreSQL errors with formatted numeric data
- **2025-01-12**: Configured production deployment for Autoscale
  - Build step: Builds React frontend only (no database operations)
  - Run step: Uses gunicorn to serve Flask on port 5000
  - Production-safe: No database wipe on deploy
- **2025-01-05**: Fixed large CSV upload issue
  - Created new `/api/tables/import` endpoint for server-side CSV parsing
  - Uploads now use multipart/form-data instead of JSON payloads
  - Eliminates 500 errors for files >100KB by avoiding payload inflation
- **2025-01-05**: Migrated to PostgreSQL for persistent storage
  - Created and initialized PostgreSQL database with test users
  - Data now persists across deployments and app restarts
  - Backend tested and working with PostgreSQL
- **2025-01-05**: Fixed deployment for Autoscale
  - Configured Flask to serve React frontend as static files
  - Updated deployment to use single port (5000) as required by Autoscale
  - Created requirements.txt for Python dependencies
  - Fixed TypeScript compilation errors (removed unused variables)
  - Removed background processes from deployment configuration
  - Added database initialization to build process
- **2025-01-04**: Initial Replit setup
  - Configured Vite to use port 5000 with host 0.0.0.0
  - Configured backend to use localhost:5050
  - Switched from PostgreSQL to SQLite for development
  - Fixed import errors in auth_service.py (timedelta)
  - Installed all required Python dependencies
  - Initialized database schema

## Configuration
- **Frontend Config**: `front-end/baked-insights-frontend/vite.config.ts`
- **Backend Config**: `back-end/src/config.py`
- Uses environment variables for secrets (SECRET_KEY, JWT_SECRET_KEY, MAIL_USERNAME, MAIL_PASSWORD)

## Development Notes
- The frontend is served through Replit's webview on port 5000
- Backend runs on localhost:8000 and is not directly accessible from outside
- API requests from frontend are proxied through Vite
