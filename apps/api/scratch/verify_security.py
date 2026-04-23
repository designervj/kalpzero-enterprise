import sys
import os
from unittest.mock import MagicMock
from fastapi import Response, HTTPException
from jose import jwt
from datetime import datetime, timedelta, UTC

# Add app to path
sys.path.append(os.getcwd())

from app.core.security import get_current_session, create_access_token
from app.core.config import get_settings

def test_expired_token():
    settings = get_settings()
    
    # Create an expired token
    token = create_access_token(
        id="user_123",
        email="test@example.com",
        tenant_id="test_tenant",
        role="admin",
        settings=settings,
        expires_delta=timedelta(seconds=-10) # Expired 10 seconds ago
    )
    
    response = MagicMock(spec=Response)
    
    # Test with cookie
    print("Testing with expired cookie...")
    session = get_current_session(
        response=response,
        credentials=None,
        auth_token=token,
        x_tenant_db=None,
        settings=settings
    )
    
    print(f"Session role: {session.role}")
    assert session.role == "guest"
    assert session.user_id is None
    
    # Verify delete_cookie was called
    response.delete_cookie.assert_called_with("auth_token")
    print("Verification successful: Cookie deleted and guest session returned.")

    # Test with Bearer token (no cookie deletion expected)
    print("\nTesting with expired Bearer token...")
    response_bearer = MagicMock(spec=Response)
    credentials = MagicMock()
    credentials.scheme = "bearer"
    credentials.credentials = token
    
    session_bearer = get_current_session(
        response=response_bearer,
        credentials=credentials,
        auth_token=None,
        x_tenant_db=None,
        settings=settings
    )
    
    print(f"Bearer session role: {session_bearer.role}")
    assert session_bearer.role == "guest"
    response_bearer.delete_cookie.assert_not_called()
    print("Verification successful: Guest session returned, no cookie to delete.")

if __name__ == "__main__":
    try:
        test_expired_token()
    except Exception as e:
        print(f"Test failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
