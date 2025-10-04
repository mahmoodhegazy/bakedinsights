# BakedInsights - Replit Setup

## Project Overview
BakedInsights is a full-stack web application for managing checklists and tables with AI-powered features.

**Tech Stack:**
- **Frontend**: React + TypeScript + Vite (Port 5000)
- **Backend**: Python Flask (Port 5050)
- **Database**: SQLite (development)

## Architecture
- **Frontend**: `/front-end/baked-insights-frontend/` - React SPA with Vite dev server
- **Backend**: `/back-end/src/` - Flask REST API
- **Database**: SQLite database at `/back-end/src/bakedinsights.db`

## Running the Application

### Frontend (Automatic)
The frontend runs automatically via the "Frontend" workflow on port 5000.

### Backend (Manual Start Required)
To start the backend server, open a new Shell tab and run:
```bash
cd back-end/src
python run.py
```

The backend will run on `http://localhost:5050`.

The frontend proxies all `/api/*` requests to the backend server.

## Default Users
The database has been initialized with test users (password: `Admin123`):
- **admin** (super_admin, tenant: 1)
- **fadmin** (admin, tenant: 1)
- **radmin** (admin, tenant: 1)
- **staff** (staff, tenant: 1)

## Recent Changes
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
