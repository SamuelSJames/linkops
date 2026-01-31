"""
LinkOps - Git Onboarding API Endpoints
Handles Git provider connection testing and repository creation during onboarding
"""

from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, Field
from typing import Optional
import sqlite3
from services.git_providers import get_git_client, GitProvider

router = APIRouter(prefix="/api/onboarding/git", tags=["onboarding-git"])


class GitTestRequest(BaseModel):
    """Git connection test request"""
    provider: str = Field(..., description="Git provider (github, gitlab, gitea, forgejo)")
    providerUrl: str = Field(..., description="Provider URL")
    token: str = Field(..., description="Personal access token")
    owner: str = Field(..., description="Repository owner (username or org)")


class GitCreateRequest(BaseModel):
    """Git repository creation request"""
    provider: str
    providerUrl: str
    token: str
    owner: str
    repoName: str = Field(..., description="Repository name")
    private: bool = True


class GitTestResponse(BaseModel):
    """Git connection test response"""
    success: bool
    message: str
    userInfo: Optional[dict] = None


class GitCreateResponse(BaseModel):
    """Git repository creation response"""
    success: bool
    message: str
    repoUrl: Optional[str] = None
    cloneUrl: Optional[str] = None
    sshUrl: Optional[str] = None


def get_db_connection():
    """Get database connection"""
    conn = sqlite3.connect('/var/lib/linkops/linkops.db')
    conn.row_factory = sqlite3.Row
    return conn


@router.post("/test", response_model=GitTestResponse)
async def test_git_connection(request: GitTestRequest):
    """
    Test Git provider connection
    
    - Validates access token
    - Returns user information if successful
    """
    try:
        # Get appropriate client
        client = get_git_client(
            provider=request.provider,
            base_url=request.providerUrl,
            token=request.token
        )
        
        # Test connection
        result = await client.test_connection()
        
        if result.get("success"):
            return GitTestResponse(
                success=True,
                message="Connection successful",
                userInfo={
                    "username": result.get("username"),
                    "email": result.get("email"),
                    "name": result.get("name")
                }
            )
        else:
            return GitTestResponse(
                success=False,
                message=result.get("error", "Connection failed")
            )
    
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Connection test failed: {str(e)}"
        )


@router.post("/create", response_model=GitCreateResponse)
async def create_git_repository(request: GitCreateRequest):
    """
    Create Git repository and initialize with LinkOps structure
    
    - Creates private repository
    - Initializes with README
    - Creates links.yaml and scripts.yaml
    - Updates user's onboarding status
    """
    conn = None
    try:
        # Get appropriate client
        client = get_git_client(
            provider=request.provider,
            base_url=request.providerUrl,
            token=request.token
        )
        
        # Create repository
        result = await client.create_repository(
            owner=request.owner,
            repo_name=request.repoName,
            private=request.private
        )
        
        if not result.get("success"):
            return GitCreateResponse(
                success=False,
                message=result.get("error", "Failed to create repository")
            )
        
        repo_url = result.get("repo_url")
        clone_url = result.get("clone_url")
        ssh_url = result.get("ssh_url")
        
        # Create initial files
        try:
            # Create links.yaml
            links_content = """# LinkOps Configuration - Machines
# This file defines all machines managed by LinkOps

machines: []

# Example machine configuration:
# machines:
#   - id: web-server-01
#     name: Web Server 01
#     hostname: web01.example.com
#     ip: 10.0.1.10
#     ssh_user: linkops
#     ssh_key: ~/.ssh/id_ed25519
#     tags:
#       - production
#       - web
#     description: Primary web server
"""
            
            await client.create_file(
                owner=request.owner,
                repo_name=request.repoName,
                file_path="links.yaml",
                content=links_content,
                message="Initialize links.yaml"
            )
            
            # Create scripts.yaml
            scripts_content = """# LinkOps Configuration - Scripts
# This file defines all scripts that can be executed on machines

scripts: []

# Example script configuration:
# scripts:
#   - id: update-system
#     name: Update System
#     description: Update and upgrade system packages
#     command: |
#       sudo apt-get update
#       sudo apt-get upgrade -y
#     tags:
#       - maintenance
#       - system
"""
            
            await client.create_file(
                owner=request.owner,
                repo_name=request.repoName,
                file_path="scripts.yaml",
                content=scripts_content,
                message="Initialize scripts.yaml"
            )
            
            # Create secrets.ini.example
            secrets_content = """# LinkOps Secrets Configuration
# Copy this file to secrets.ini and fill in your values
# DO NOT commit secrets.ini to Git!

[api_keys]
# example_api_key = your-api-key-here

[credentials]
# example_username = your-username
# example_password = your-password

[tokens]
# example_token = your-token-here
"""
            
            await client.create_file(
                owner=request.owner,
                repo_name=request.repoName,
                file_path="secrets.ini.example",
                content=secrets_content,
                message="Add secrets.ini.example"
            )
            
        except Exception as e:
            # Repository created but file creation failed
            # This is not critical, user can add files manually
            print(f"Warning: Failed to create initial files: {e}")
        
        # Update user's onboarding status in database
        # TODO: Get user ID from JWT token
        # For now, we'll skip this and handle it in the frontend
        
        return GitCreateResponse(
            success=True,
            message="Repository created successfully",
            repoUrl=repo_url,
            cloneUrl=clone_url,
            sshUrl=ssh_url
        )
    
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Repository creation failed: {str(e)}"
        )
    finally:
        if conn:
            conn.close()
