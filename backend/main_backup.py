"""LinkOps Backend API - Main application."""
from fastapi import FastAPI, Depends, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
import asyncio
from config import config
from db.database import init_database
from services.auth_service import AuthService
from services.git_sync_engine import GitSyncEngine
from services.ssh_manager import SSHManager
from services.enrollment_verifier import EnrollmentVerifier
from services.ssh_orchestrator import SSHOrchestrator
from services.terminal_manager import TerminalManager
from services.health_monitor import HealthMonitor

# Global service instances
auth_service = None
git_sync_engine = None
ssh_manager = None
enrollment_verifier = None
ssh_orchestrator = None
terminal_manager = None
health_monitor = None
sync_task = None
health_task = None

app = FastAPI(title="LinkOps Backend API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    """Initialize services on startup."""
    global auth_service, git_sync_engine, ssh_manager, enrollment_verifier
    global ssh_orchestrator, terminal_manager, health_monitor, sync_task, health_task
    
    # Initialize database
    await init_database()
    
    # Initialize services
    auth_service = AuthService(
        db_path="/var/lib/linkops/linkops.db",
        jwt_secret=config.jwt_secret,
        jwt_algorithm=config.jwt_algorithm,
        jwt_expiration_hours=config.jwt_expiration_hours,
        max_failed_attempts=config.max_failed_attempts,
        lockout_duration_minutes=config.lockout_duration_minutes
    )

    # Initialize onboarding JWT secret
    from api.onboarding import init_jwt_secret
    init_jwt_secret(config.jwt_secret)
    
    git_sync_engine = GitSyncEngine(
        repo_url=config.git_repository_url,
        branch=config.git_branch,
        repo_path=config.git_repo_path,
        db_path="/var/lib/linkops/linkops.db"
    )
    
    ssh_manager = SSHManager(
        keys_directory=config.ssh_keys_directory,
        known_hosts=config.ssh_known_hosts,
        connection_timeout=config.ssh_connection_timeout
    )
    
    enrollment_verifier = EnrollmentVerifier(
        ssh_manager=ssh_manager,
        db_path="/var/lib/linkops/linkops.db"
    )
    
    ssh_orchestrator = SSHOrchestrator(
        ssh_manager=ssh_manager,
        db_path="/var/lib/linkops/linkops.db",
        git_repo_path=config.git_repo_path
    )
    
    terminal_manager = TerminalManager(
        ssh_manager=ssh_manager,
        db_path="/var/lib/linkops/linkops.db"
    )
    
    health_monitor = HealthMonitor(
        ssh_manager=ssh_manager,
        db_path="/var/lib/linkops/linkops.db",
        check_interval=300
    )
    
    # Start periodic Git sync
    async def periodic_sync():
        while True:
            await asyncio.sleep(config.git_sync_interval_minutes * 60)
            try:
                await git_sync_engine.sync()
            except Exception as e:
                print(f"Git sync error: {e}")
    
    sync_task = asyncio.create_task(periodic_sync())
    
    # Start health monitoring
    health_task = asyncio.create_task(health_monitor.start())
    
    # Initial sync (skip if Git not configured yet)
    try:
        await git_sync_engine.sync()
    except Exception as e:
        print(f"Initial Git sync skipped: {e}")

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown."""
    global sync_task, health_task, health_monitor
    
    if sync_task:
        sync_task.cancel()
    if health_task:
        health_task.cancel()
    if health_monitor:
        await health_monitor.stop()

# Auth dependency
async def get_current_user(authorization: str = Header(None)):
    """Verify JWT token."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    token = authorization.split(" ")[1]
    username = auth_service.verify_token(token)
    
    if not username:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    return username

# Health check
@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": "1.0.0"}

# Import and include routers
from api import auth, links, operations, git_api, tables, terminal
from api import onboarding
from api import git_onboarding

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(onboarding.router, tags=["onboarding"])
app.include_router(git_onboarding.router, tags=["onboarding-git"])
app.include_router(links.router, prefix="/api/links", tags=["links"])
app.include_router(operations.router, prefix="/api/operations", tags=["operations"])
app.include_router(git_api.router, prefix="/api/git", tags=["git"])
app.include_router(tables.router, prefix="/api/tables", tags=["tables"])
app.include_router(terminal.router, prefix="/api/terminal", tags=["terminal"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=config.api_host, port=config.api_port)
