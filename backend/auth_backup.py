"""Authentication API endpoints."""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import sqlite3

router = APIRouter()

class LoginRequest(BaseModel):
    username: str
    password: str

class LoginResponse(BaseModel):
    token: str
    expires_in: int
    user_id: int
    is_admin: bool
    onboarding_completed: bool
    onboarding_step: int

@router.post("/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    """Authenticate user and return JWT token."""
    from main import auth_service
    
    token = await auth_service.authenticate(request.username, request.password)
    
    if not token:
        raise HTTPException(status_code=401, detail="Invalid credentials or account locked")
    
    # Get user info including onboarding status
    conn = sqlite3.connect('/var/lib/linkops/linkops.db')
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute(
        "SELECT id, username, is_admin, onboarding_completed, onboarding_step FROM users WHERE username = ?",
        (request.username,)
    )
    user = cursor.fetchone()
    conn.close()
    
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    return LoginResponse(
        token=token,
        expires_in=24 * 3600,
        user_id=user['id'],
        is_admin=bool(user['is_admin']),
        onboarding_completed=bool(user['onboarding_completed']),
        onboarding_step=user['onboarding_step'] or 0
    )
