# BakedInsights - Replit Setup

## Project Overview
BakedInsights is a full-stack web application for managing checklists and tables with AI-powered features.

**Tech Stack:**
- **Frontend**: React + TypeScript + Vite (Port 5000)
- **Backend**: Python Flask (Port 5050)
- **Database**: PostgreSQL (Replit-managed, persistent)

## Architecture
- **Frontend**: `/front-end/baked-insights-frontend/` - React SPA with Vite dev server
- **Backend**: `/back-end/src/` - Flask REST API
- **Database**: PostgreSQL (managed by Replit, accessible via DATABASE_URL)

## Running the Application

### Development Mode
The frontend runs automatically via the "Frontend" workflow on port 5000.

To start the backend server during development, open a new Shell tab and run:
```bash
cd back-end/src
python run.py
```

The backend will run on `http://localhost:5050`.

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
- **2025-01-27**: Updated table_service.py with optimized bulk operations
  - `bulk_insert_table_data`: Uses `bulk_save_objects` for records and table data
  - `update_table_data`: Batch fetches columns and existing data (2 queries vs per-cell)
  - `create_table`: Uses bulk insert for cell data instead of per-row updates
  - Performance: 1000 rows × 10 columns = ~3 queries (was 20,000+)
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
- Backend runs on localhost:5050 and is not directly accessible from outside
- API requests from frontend are proxied through Vite
