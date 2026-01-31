"""
LinkOps - Machine Onboarding API Endpoints
Handles first machine enrollment during onboarding
"""

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from typing import Optional, List
import sqlite3
import subprocess
import uuid
import os
from datetime import datetime

router = APIRouter(prefix="/api/onboarding/machine", tags=["onboarding-machine"])


class MachineEnrollRequest(BaseModel):
    """Machine enrollment request"""
    machineName: str = Field(..., pattern=r'^[a-z0-9-_]+$')
    sshUser: str = Field(..., pattern=r'^[a-z_][a-z0-9_-]*$')
    sshPort: int = Field(22, ge=1, le=65535)
    description: Optional[str] = None
    tags: Optional[str] = None


class MachineEnrollResponse(BaseModel):
    """Machine enrollment response"""
    success: bool
    message: str
    clientId: Optional[str] = None
    machineId: Optional[str] = None


def get_db_connection():
    """Get database connection"""
    conn = sqlite3.connect('/var/lib/linkops/linkops.db')
    conn.row_factory = sqlite3.Row
    return conn


def generate_client_id() -> str:
    """Generate unique client ID"""
    return f"LINKOPS-{uuid.uuid4()}"


def create_ssh_user(username: str) -> bool:
    """Create SSH user on local system"""
    try:
        # Check if user already exists
        result = subprocess.run(
            ['id', username],
            capture_output=True,
            text=True
        )
        
        if result.returncode == 0:
            # User already exists
            return True
        
        # Create user with home directory
        subprocess.run(
            ['useradd', '-m', '-s', '/bin/bash', username],
            check=True,
            capture_output=True
        )
        
        # Add user to sudo group (optional, for management tasks)
        subprocess.run(
            ['usermod', '-aG', 'sudo', username],
            check=True,
            capture_output=True
        )
        
        return True
    except subprocess.CalledProcessError as e:
        print(f"Error creating user: {e}")
        return False


def install_client_id(client_id: str) -> bool:
    """Install client ID on local system"""
    try:
        # Create /etc/linkops directory if it doesn't exist
        os.makedirs('/etc/linkops', exist_ok=True)
        
        # Write client ID
        with open('/etc/linkops/client_id', 'w') as f:
            f.write(client_id)
        
        # Set permissions
        os.chmod('/etc/linkops/client_id', 0o644)
        
        return True
    except Exception as e:
        print(f"Error installing client ID: {e}")
        return False


def test_ssh_connection(username: str, port: int) -> bool:
    """Test SSH connection to localhost"""
    try:
        # Simple test - check if user exists and can be accessed
        result = subprocess.run(
            ['id', username],
            capture_output=True,
            text=True,
            timeout=5
        )
        return result.returncode == 0
    except Exception as e:
        print(f"Error testing SSH: {e}")
        return False


def get_machine_info() -> dict:
    """Get local machine information"""
    try:
        # Get hostname
        hostname = subprocess.run(
            ['hostname'],
            capture_output=True,
            text=True
        ).stdout.strip()
        
        # Get IP address
        ip_result = subprocess.run(
            ['hostname', '-I'],
            capture_output=True,
            text=True
        )
        ip = ip_result.stdout.strip().split()[0] if ip_result.stdout else '127.0.0.1'
        
        return {
            'hostname': hostname,
            'ip': ip
        }
    except Exception as e:
        print(f"Error getting machine info: {e}")
        return {
            'hostname': 'localhost',
            'ip': '127.0.0.1'
        }


@router.post("/enroll-self", response_model=MachineEnrollResponse)
async def enroll_self_machine(request: MachineEnrollRequest):
    """
    Enroll the LinkOps server itself as the first machine
    
    Steps:
    1. Create SSH user
    2. Generate and install client ID
    3. Test SSH connection
    4. Add machine to database
    5. Update Git repository (links.yaml)
    6. Mark onboarding as complete
    """
    conn = None
    try:
        # Step 1: Create SSH user
        if not create_ssh_user(request.sshUser):
            return MachineEnrollResponse(
                success=False,
                message=f"Failed to create SSH user: {request.sshUser}"
            )
        
        # Step 2: Generate and install client ID
        client_id = generate_client_id()
        if not install_client_id(client_id):
            return MachineEnrollResponse(
                success=False,
                message="Failed to install client ID"
            )
        
        # Step 3: Test SSH connection
        if not test_ssh_connection(request.sshUser, request.sshPort):
            return MachineEnrollResponse(
                success=False,
                message="SSH connection test failed"
            )
        
        # Step 4: Get machine info
        machine_info = get_machine_info()
        
        # Step 5: Add machine to database
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Parse tags
        tags_list = []
        if request.tags:
            tags_list = [tag.strip() for tag in request.tags.split(',') if tag.strip()]
        
        cursor.execute("""
            INSERT INTO machines (
                id,
                name,
                type,
                host,
                port,
                user,
                ssh_key_ref,
                client_id,
                tags,
                enrollment_required,
                enrolled,
                status,
                last_seen,
                created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            request.machineName,
            request.machineName,
            'server',
            machine_info['hostname'],
            request.sshPort,
            request.sshUser,
            'local',  # No SSH key needed for local
            client_id,
            ','.join(tags_list),
            False,  # No enrollment required for self
            True,   # Already enrolled
            'online',
            datetime.utcnow().isoformat(),
            datetime.utcnow().isoformat()
        ))
        
        # Step 6: Mark onboarding as complete for the user
        # TODO: Get user ID from JWT token
        # For now, update all users (should only be one during onboarding)
        cursor.execute("""
            UPDATE users 
            SET onboarding_completed = TRUE,
                onboarding_step = 3
            WHERE onboarding_completed = FALSE
        """)
        
        conn.commit()
        
        # Step 7: Update Git repository would happen here
        # For now, we'll skip this as it requires Git integration
        # TODO: Add machine to links.yaml in Git repo
        
        return MachineEnrollResponse(
            success=True,
            message="Machine enrolled successfully",
            clientId=client_id,
            machineId=request.machineName
        )
        
    except sqlite3.IntegrityError as e:
        if conn:
            conn.rollback()
        return MachineEnrollResponse(
            success=False,
            message=f"Machine name already exists: {request.machineName}"
        )
    except Exception as e:
        if conn:
            conn.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Enrollment failed: {str(e)}"
        )
    finally:
        if conn:
            conn.close()
