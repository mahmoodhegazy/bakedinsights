"""
Copyright (c) BakedInsights, Inc. and affiliates.
All rights reserved.
"""

from flask import g
from flask_jwt_extended import get_jwt, verify_jwt_in_request


def setup_tenant_context():
    """
    Extract tenant_id from JWT and set PgSQL RLS
    """
    # Verifies and decodes the token
    if verify_jwt_in_request():
        claims = get_jwt()
        tenant_id = claims.get("tenant_id")
        g.tenant_id = tenant_id
    else:
        g.tenant_id = None
