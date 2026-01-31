"""
LinkOps - Git Provider Services
Handles integration with GitHub, GitLab, Gitea, and Forgejo
"""

import httpx
from typing import Dict, Any, Optional
from enum import Enum


class GitProvider(str, Enum):
    GITHUB = "github"
    GITLAB = "gitlab"
    GITEA = "gitea"
    FORGEJO = "forgejo"


class GitProviderClient:
    """Base class for Git provider API clients"""
    
    def __init__(self, base_url: str, token: str):
        self.base_url = base_url.rstrip('/')
        self.token = token
        self.headers = self._get_headers()
    
    def _get_headers(self) -> Dict[str, str]:
        """Get authentication headers"""
        raise NotImplementedError
    
    async def test_connection(self) -> Dict[str, Any]:
        """Test connection and get user info"""
        raise NotImplementedError
    
    async def create_repository(self, owner: str, repo_name: str, private: bool = True) -> Dict[str, Any]:
        """Create a new repository"""
        raise NotImplementedError
    
    async def create_file(self, owner: str, repo_name: str, file_path: str, content: str, message: str) -> bool:
        """Create a file in the repository"""
        raise NotImplementedError


class GitHubClient(GitProviderClient):
    """GitHub API client"""
    
    def _get_headers(self) -> Dict[str, str]:
        return {
            "Authorization": f"token {self.token}",
            "Accept": "application/vnd.github.v3+json"
        }
    
    async def test_connection(self) -> Dict[str, Any]:
        """Test GitHub connection"""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/user",
                headers=self.headers,
                timeout=10.0
            )
            
            if response.status_code == 200:
                data = response.json()
                return {
                    "success": True,
                    "username": data.get("login"),
                    "email": data.get("email"),
                    "name": data.get("name")
                }
            else:
                return {
                    "success": False,
                    "error": f"Authentication failed: {response.status_code}"
                }
    
    async def create_repository(self, owner: str, repo_name: str, private: bool = True) -> Dict[str, Any]:
        """Create GitHub repository"""
        async with httpx.AsyncClient() as client:
            # Check if repo exists
            check_response = await client.get(
                f"{self.base_url}/repos/{owner}/{repo_name}",
                headers=self.headers,
                timeout=10.0
            )
            
            if check_response.status_code == 200:
                return {
                    "success": False,
                    "error": f"Repository {owner}/{repo_name} already exists"
                }
            
            # Create repository
            response = await client.post(
                f"{self.base_url}/user/repos",
                headers=self.headers,
                json={
                    "name": repo_name,
                    "description": "LinkOps configuration repository",
                    "private": private,
                    "auto_init": True
                },
                timeout=10.0
            )
            
            if response.status_code == 201:
                data = response.json()
                return {
                    "success": True,
                    "repo_url": data.get("html_url"),
                    "clone_url": data.get("clone_url"),
                    "ssh_url": data.get("ssh_url")
                }
            else:
                return {
                    "success": False,
                    "error": f"Failed to create repository: {response.text}"
                }
    
    async def create_file(self, owner: str, repo_name: str, file_path: str, content: str, message: str) -> bool:
        """Create file in GitHub repository"""
        import base64
        
        async with httpx.AsyncClient() as client:
            response = await client.put(
                f"{self.base_url}/repos/{owner}/{repo_name}/contents/{file_path}",
                headers=self.headers,
                json={
                    "message": message,
                    "content": base64.b64encode(content.encode()).decode()
                },
                timeout=10.0
            )
            
            return response.status_code == 201


class GitLabClient(GitProviderClient):
    """GitLab API client"""
    
    def _get_headers(self) -> Dict[str, str]:
        return {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }
    
    async def test_connection(self) -> Dict[str, Any]:
        """Test GitLab connection"""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/api/v4/user",
                headers=self.headers,
                timeout=10.0
            )
            
            if response.status_code == 200:
                data = response.json()
                return {
                    "success": True,
                    "username": data.get("username"),
                    "email": data.get("email"),
                    "name": data.get("name")
                }
            else:
                return {
                    "success": False,
                    "error": f"Authentication failed: {response.status_code}"
                }
    
    async def create_repository(self, owner: str, repo_name: str, private: bool = True) -> Dict[str, Any]:
        """Create GitLab repository"""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/api/v4/projects",
                headers=self.headers,
                json={
                    "name": repo_name,
                    "description": "LinkOps configuration repository",
                    "visibility": "private" if private else "public",
                    "initialize_with_readme": True
                },
                timeout=10.0
            )
            
            if response.status_code == 201:
                data = response.json()
                return {
                    "success": True,
                    "repo_url": data.get("web_url"),
                    "clone_url": data.get("http_url_to_repo"),
                    "ssh_url": data.get("ssh_url_to_repo")
                }
            else:
                return {
                    "success": False,
                    "error": f"Failed to create repository: {response.text}"
                }
    
    async def create_file(self, owner: str, repo_name: str, file_path: str, content: str, message: str) -> bool:
        """Create file in GitLab repository"""
        # Get project ID first
        async with httpx.AsyncClient() as client:
            # Search for project
            search_response = await client.get(
                f"{self.base_url}/api/v4/projects",
                headers=self.headers,
                params={"search": repo_name},
                timeout=10.0
            )
            
            if search_response.status_code != 200:
                return False
            
            projects = search_response.json()
            project_id = None
            for project in projects:
                if project.get("path") == repo_name:
                    project_id = project.get("id")
                    break
            
            if not project_id:
                return False
            
            # Create file
            response = await client.post(
                f"{self.base_url}/api/v4/projects/{project_id}/repository/files/{file_path}",
                headers=self.headers,
                json={
                    "branch": "main",
                    "content": content,
                    "commit_message": message
                },
                timeout=10.0
            )
            
            return response.status_code == 201


class GiteaClient(GitProviderClient):
    """Gitea API client (also works for Forgejo)"""
    
    def _get_headers(self) -> Dict[str, str]:
        return {
            "Authorization": f"token {self.token}",
            "Content-Type": "application/json"
        }
    
    async def test_connection(self) -> Dict[str, Any]:
        """Test Gitea/Forgejo connection"""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/api/v1/user",
                headers=self.headers,
                timeout=10.0
            )
            
            if response.status_code == 200:
                data = response.json()
                return {
                    "success": True,
                    "username": data.get("login"),
                    "email": data.get("email"),
                    "name": data.get("full_name")
                }
            else:
                return {
                    "success": False,
                    "error": f"Authentication failed: {response.status_code}"
                }
    
    async def create_repository(self, owner: str, repo_name: str, private: bool = True) -> Dict[str, Any]:
        """Create Gitea/Forgejo repository"""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/api/v1/user/repos",
                headers=self.headers,
                json={
                    "name": repo_name,
                    "description": "LinkOps configuration repository",
                    "private": private,
                    "auto_init": True,
                    "default_branch": "main"
                },
                timeout=10.0
            )
            
            if response.status_code == 201:
                data = response.json()
                return {
                    "success": True,
                    "repo_url": data.get("html_url"),
                    "clone_url": data.get("clone_url"),
                    "ssh_url": data.get("ssh_url")
                }
            else:
                return {
                    "success": False,
                    "error": f"Failed to create repository: {response.text}"
                }
    
    async def create_file(self, owner: str, repo_name: str, file_path: str, content: str, message: str) -> bool:
        """Create file in Gitea/Forgejo repository"""
        import base64
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/api/v1/repos/{owner}/{repo_name}/contents/{file_path}",
                headers=self.headers,
                json={
                    "message": message,
                    "content": base64.b64encode(content.encode()).decode()
                },
                timeout=10.0
            )
            
            return response.status_code == 201


def get_git_client(provider: str, base_url: str, token: str) -> GitProviderClient:
    """Factory function to get appropriate Git provider client"""
    if provider == GitProvider.GITHUB:
        return GitHubClient("https://api.github.com", token)
    elif provider == GitProvider.GITLAB:
        return GitLabClient(base_url, token)
    elif provider == GitProvider.GITEA:
        return GiteaClient(base_url, token)
    elif provider == GitProvider.FORGEJO:
        return GiteaClient(base_url, token)  # Forgejo uses Gitea API
    else:
        raise ValueError(f"Unsupported provider: {provider}")
