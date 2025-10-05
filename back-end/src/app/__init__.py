"""
Copyright (c) BakedInsights, Inc. and affiliates.
All rights reserved.
"""

import os
import sys

from config import Config
from flask import Flask, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_mail import Mail
from flask_sqlalchemy import SQLAlchemy


sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Initialize extensions
db = SQLAlchemy()  # Database ORM
jwt = JWTManager()  # JWT handling for authentication
mail = Mail()  # Mail for handling automated emails

def create_app():
    """
    Application Factory Function
    Creates and configures the Flask application with all necessary extensions and blueprints
    Returns: Configured Flask application instance
    """
    flask_app = Flask(__name__)
    flask_app.config.from_object(Config)
    
    # Configure static file serving for production
    static_folder = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), 'front-end', 'baked-insights-frontend', 'dist')
    flask_app.static_folder = static_folder
    flask_app.static_url_path = ''

    # Initialize Flask extensions
    db.init_app(flask_app)
    jwt.init_app(flask_app)
    mail.init_app(flask_app)
    CORS(flask_app, supports_credentials=True)  # Your React app origin

    # Import and register blueprints for modular routing
    from app.routes import auth, checklists, tables, users, files

    # Each blueprint has its own URL prefix for API organization
    flask_app.register_blueprint(auth.auth_bp, url_prefix='/api/auth')
    flask_app.register_blueprint(checklists.checklist_bp, url_prefix='/api/checklists')
    flask_app.register_blueprint(users.user_bp, url_prefix='/api/users')
    flask_app.register_blueprint(tables.table_bp, url_prefix='/api/tables')
    flask_app.register_blueprint(files.file_bp, url_prefix='/api/files')
    
    # Serve React frontend for all non-API routes
    @flask_app.route('/', defaults={'path': ''})
    @flask_app.route('/<path:path>')
    def serve_frontend(path):
        static_dir = flask_app.static_folder
        if static_dir and path and os.path.exists(os.path.join(static_dir, path)):
            return send_from_directory(static_dir, path)
        if static_dir:
            return send_from_directory(static_dir, 'index.html')
        return 'Static folder not configured', 500

    return flask_app
