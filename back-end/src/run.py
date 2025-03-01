"""
Copyright (c) BakedInsights, Inc. and affiliates.
All rights reserved.
"""

from app import create_app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, port=5050)
else:
    gunicorn_app = create_app()
