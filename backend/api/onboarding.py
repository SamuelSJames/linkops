"""
LinkOps - Onboarding API Endpoints
Handles user registration and initial setup
"""

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr, Field, validator
from passlib.context import CryptContext
from jose import jwt
from datetime import datetime, timedelta
import re
import sqlite3
from typing import Optional

router = APIRouter(prefix="/api/onboarding", tags=["onboarding"])

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__rounds=12)

# JWT settings (should match config.py)
JWT_SECRET = None  # Will be loaded from config
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24


class UserRegistration(BaseModel):
    """User registration request model"""
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=20, pattern=r'^[a-zA-Z0-9_-]+$')
    firstName: str = Field(..., min_length=2, max_length=50)
    lastName: Optional[str] = Field(None, max_length=50)
    password: str = Field(..., min_length=12)
    
    @validator('password')
    def validate_password_complexity(cls, v):
        """Validate password meets complexity requirements"""
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not re.search(r'[a-z]', v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not re.search(r'[0-9]', v):
            raise ValueError('Password must contain at least one number')
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', v):
            raise ValueError('Password must contain at least one special character')
        return v


class UserRegistrationResponse(BaseModel):
    """User registration response model"""
    userId: int
    message: str
    token: str
    expiresIn: int


def get_db_connection():
    """Get database connection"""
    conn = sqlite3.connect('/var/lib/linkops/linkops.db')
    conn.row_factory = sqlite3.Row
    return conn


def create_jwt_token(user_id: int, username: str, is_admin: bool) -> str:
    """Create JWT token for user"""
    expires = datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS)
    payload = {
        'sub': str(user_id),
        'username': username,
        'is_admin': is_admin,
        'exp': expires
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def check_if_first_user(conn) -> bool:
    """Check if this is the first user (should be admin)"""
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) as count FROM users")
    result = cursor.fetchone()
    return result['count'] == 0


def check_email_exists(conn, email: str) -> bool:
    """Check if email already exists"""
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM users WHERE email = ?", (email,))
    return cursor.fetchone() is not None


def check_username_exists(conn, username: str) -> bool:
    """Check if username already exists"""
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM users WHERE username = ?", (username,))
    return cursor.fetchone() is not None


@router.post("/register", response_model=UserRegistrationResponse, status_code=status.HTTP_201_CREATED)
async def register_user(user: UserRegistration):
    """
    Register a new user
    
    - First user automatically becomes admin
    - Email and username must be unique
    - Password must meet complexity requirements (12+ chars, uppercase, lowercase, number, special char)
    - Returns JWT token for immediate login
    """
    conn = None
    try:
        conn = get_db_connection()
        
        # Check if email already exists
        if check_email_exists(conn, user.email):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This email is already registered. Please login."
            )
        
        # Check if username already exists
        if check_username_exists(conn, user.username):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username not available. Try another."
            )
        
        # Check if this is the first user
        is_first_user = check_if_first_user(conn)
        is_admin = is_first_user
        
        # Hash password
        password_hash = pwd_context.hash(user.password)
        
        # Insert user into database
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO users (
                username, 
                email, 
                password_hash, 
                first_name, 
                last_name, 
                is_admin,
                onboarding_completed,
                onboarding_step,
                created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            user.username,
            user.email,
            password_hash,
            user.firstName,
            user.lastName or '',
            is_admin,
            False,  # onboarding not completed yet
            1,      # completed step 1 (registration)
            datetime.utcnow().isoformat()
        ))
        
        conn.commit()
        user_id = cursor.lastrowid
        
        # Generate JWT token
        token = create_jwt_token(user_id, user.username, is_admin)
        
        return UserRegistrationResponse(
            userId=user_id,
            message="Account created successfully",
            token=token,
            expiresIn=JWT_EXPIRATION_HOURS * 3600  # seconds
        )
        
    except HTTPException:
        raise
    except Exception as e:
        if conn:
            conn.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(e)}"
        )
    finally:
        if conn:
            conn.close()


def init_jwt_secret(secret: str):
    """Initialize JWT secret from config"""
    global JWT_SECRET
    JWT_SECRET = secret
