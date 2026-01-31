# LinkOps Backend - AI Implementation Guide

This guide is specifically designed for AI assistants to implement the LinkOps backend API following the complete specification.

## Overview

You are tasked with building a FastAPI-based backend for LinkOps, a secure SSH orchestration platform. The frontend is complete, and you have a comprehensive specification with requirements, design, and implementation tasks.

## What You Have

### 1. Complete Specification
- **Location**: `.kiro/specs/linkops-backend-api/`
- **Requirements**: 13 major requirements with 65 acceptance criteria
- **Design**: Complete architecture with 37 correctness properties
- **Tasks**: 28 implementation tasks organized in 7 phases

### 2. Frontend Application (Complete)
- **Location**: `frontend/` directory
- **Files**: `index.html`, `login.html`, CSS, JavaScript, assets
- **Status**: Fully functional with demo data
- **Integration Points**: Documented in `BACKEND_INTEGRATION_GUIDE.md`

### 3. Deployment Infrastructure
- **Location**: `deployment/` directory
- **Files**: Installation scripts, systemd service, configuration templates
- **Target**: Ubuntu 24.04 LXC container

### 4. Example Git Repository
- **Location**: `git-repo-example/` directory
- **Files**: `links.yaml`, `scripts.yaml`, `secrets.ini` examples
- **Purpose**: Template for configuration repository

## Implementation Strategy

### Phase-by-Phase Approach

Follow the tasks in `.kiro/specs/linkops-backend-api/tasks.md` sequentially:

```
Phase 1: Authentication (9 hours)
  ├─ Task 1.1: Initialize FastAPI project
  ├─ Task 1.2: Implement database schema
  └─ Task 1.3: Implement JWT authentication

Phase 2: Git Sync (14 hours)
  ├─ Task 2.1: Implement Git sync engine
  ├─ Task 2.2: Implement inventory management
  └─ Task 2.3: Implement enrollment verification

Phase 3: SSH Orchestration (19 hours)
  ├─ Task 3.1: Implement SSH connection management
  ├─ Task 3.2: Implement SSH orchestrator
  ├─ Task 3.3: Implement operations API
  └─ Task 3.4: Implement SSE streaming

Phase 4: Terminal Sessions (14 hours)
  ├─ Task 4.1: Implement terminal manager
  ├─ Task 4.2: Implement WebSocket handler
  └─ Task 4.3: Implement terminal API

Phase 5: Table Queries (9 hours)
  ├─ Task 5.1: Implement table query engine
  └─ Task 5.2: Implement health monitoring

Phase 6: Configuration (15 hours)
  ├─ Task 6.1: Implement configuration management
  ├─ Task 6.2: Implement error handling
  ├─ Task 6.3: Implement audit trail
  ├─ Task 6.4: Create systemd service
  └─ Task 6.5: Create deployment scripts

Phase 7: Testing (18 hours)
  ├─ Task 7.1: Complete property-based tests
  ├─ Task 7.2: Complete integration tests
  ├─ Task 7.3: Create API documentation
  └─ Task 7.4: Create deployment documentation
```

### Reading Order

1. **Start here**: `.kiro/specs/linkops-backend-api/README.md`
2. **Understand requirements**: `.kiro/specs/linkops-backend-api/requirements.md`
3. **Study design**: `.kiro/specs/linkops-backend-api/design.md`
4. **Follow tasks**: `.kiro/specs/linkops-backend-api/tasks.md`
5. **Reference integration**: `BACKEND_INTEGRATION_GUIDE.md`

## Key Implementation Details

### 1. Project Structure

Create this exact structure:

```
backend/
├── main.py                     # FastAPI application entry point
├── config.py                   # Configuration management
├── logging_config.py           # Logging setup
├── requirements.txt            # Python dependencies (already created)
│
├── api/                        # API endpoints
│   ├── __init__.py
│   ├── auth.py                # POST /api/auth/login
│   ├── links.py               # GET /api/links, GET /api/links/{id}
│   ├── operations.py          # POST /api/operations/run, GET /api/operations/{id}
│   ├── terminal.py            # POST /api/terminal/workspaces, WS endpoint
│   ├── tables.py              # POST /api/tables/query
│   ├── git.py                 # GET /api/git/status, POST /api/git/sync
│   └── sse.py                 # GET /api/operations/{id}/events
│
├── services/                   # Business logic
│   ├── __init__.py
│   ├── auth_service.py        # JWT authentication
│   ├── git_sync_engine.py     # Git clone/pull and YAML parsing
│   ├── enrollment_verifier.py # Client ID verification
│   ├── ssh_orchestrator.py    # Script execution
│   ├── terminal_manager.py    # Terminal workspace management
│   ├── table_query_engine.py  # Unified table queries
│   ├── health_monitor.py      # Health checks
│   └── ssh_manager.py         # SSH connection management
│
├── db/                         # Database layer
│   ├── __init__.py
│   ├── schema.sql             # Database schema
│   ├── database.py            # Database connection
│   ├── models.py              # Data models
│   └── migrations.py          # Schema migrations
│
├── middleware/                 # Middleware
│   ├── __init__.py
│   ├── auth_middleware.py     # JWT validation
│   └── error_handler.py       # Error handling
│
└── parsers/                    # YAML parsers
    ├── __init__.py
    └── yaml_parser.py         # Parse links.yaml and scripts.yaml
```

### 2. Database Schema

Implement these 8 tables (see `design.md` for complete schema):

1. `machines` - Machine inventory
2. `scripts` - Script catalog
3. `operations` - Operation records
4. `operation_logs` - Execution logs
5. `terminal_workspaces` - Terminal workspaces
6. `terminal_panes` - Terminal panes
7. `auth_attempts` - Authentication attempts
8. `git_sync_history` - Git sync history

### 3. API Endpoints

Implement these endpoints (see `design.md` for complete specifications):

**Authentication:**
- `POST /api/auth/login` → Returns JWT token

**Inventory:**
- `GET /api/links` → Returns all machines
- `GET /api/links/{id}` → Returns specific machine
- `POST /api/links/{id}/verify` → Verifies enrollment

**Operations:**
- `POST /api/operations/run` → Executes scripts
- `GET /api/operations/{id}` → Returns operation status
- `GET /api/operations/{id}/events` → SSE stream
- `POST /api/operations/{id}/stop` → Stops operation

**Terminal:**
- `POST /api/terminal/workspaces` → Creates workspace
- `PUT /api/terminal/workspaces/{id}/panes` → Assigns panes
- `POST /api/terminal/workspaces/{id}/connect-all` → Connects all
- `WS /api/terminal/workspaces/{id}/ws` → WebSocket connection

**Table Queries:**
- `POST /api/tables/query` → Unified table query

**Git Sync:**
- `GET /api/git/status` → Returns sync status
- `POST /api/git/sync` → Triggers sync

### 4. Property-Based Testing

Implement all 37 correctness properties using Hypothesis:

```python
from hypothesis import given, settings, strategies as st

@settings(max_examples=100)
@given(username=st.text(min_size=1), password=st.text(min_size=1))
async def test_property_1_jwt_token_generation(username, password):
    """
    Feature: linkops-backend-api, Property 1: JWT token generation and expiration
    
    For any valid credentials, authenticating should return a JWT token
    that expires exactly 24 hours from issuance and validates successfully
    before expiration.
    """
    # Test implementation
    pass
```

**All 37 properties are listed in `design.md` under "Correctness Properties"**

### 5. Configuration

Load configuration from `/etc/linkops/config.ini`:

```python
import configparser

def load_config():
    config = configparser.ConfigParser()
    config.read('/etc/linkops/config.ini')
    return config
```

**Configuration sections:**
- `[api]` - API server settings
- `[database]` - Database path
- `[git]` - Git repository settings
- `[ssh]` - SSH settings
- `[security]` - Security settings
- `[operations]` - Operation settings
- `[terminal]` - Terminal settings
- `[health]` - Health monitoring
- `[logging]` - Logging configuration

## Critical Requirements

### 1. Enrollment Verification

**Every operation must verify enrollment:**

```python
async def verify_enrollment(link: Link) -> bool:
    """
    Connect to target machine and verify client ID file.
    
    1. SSH to target machine
    2. Read /etc/linkops/client_id
    3. Compare with link.enrollment.clientId
    4. Return True if match, False otherwise
    """
    pass
```

### 2. Bash-Only Execution

**Only bash scripts are allowed:**

```python
async def execute_script(script: Script, link: Link) -> ExecutionResult:
    """
    Execute script on target machine.
    
    1. Verify script starts with #!/bin/bash
    2. Reject any other interpreter
    3. Execute via SSH
    4. Capture stdout, stderr, exit code
    """
    pass
```

### 3. Git Sync

**Parse YAML and update database:**

```python
async def sync_repository() -> SyncResult:
    """
    Sync Git repository and update database.
    
    1. Clone or pull repository
    2. Parse links.yaml
    3. Parse scripts.yaml
    4. Update machines table
    5. Update scripts table
    6. Record sync in git_sync_history
    """
    pass
```

### 4. Real-Time Streaming

**Use Server-Sent Events for operations:**

```python
async def stream_operation_events(operation_id: str):
    """
    Stream operation events via SSE.
    
    1. Connect to SSE endpoint
    2. Stream script start events
    3. Stream output events
    4. Stream completion events
    5. Close stream when operation completes
    """
    pass
```

### 5. WebSocket Terminal

**Bidirectional I/O for terminals:**

```python
async def handle_websocket(websocket: WebSocket, workspace_id: str):
    """
    Handle WebSocket connection for terminal I/O.
    
    1. Authenticate WebSocket connection
    2. Route stdin from client to SSH session
    3. Route stdout from SSH session to client
    4. Handle multiple panes in single connection
    5. Clean up on disconnect
    """
    pass
```

## Testing Strategy

### Unit Tests

Test individual components:

```python
# tests/unit/test_auth.py
async def test_authenticate_valid_credentials():
    result = await auth_service.authenticate("admin", "admin")
    assert result.success == True
    assert result.token is not None

async def test_authenticate_invalid_credentials():
    result = await auth_service.authenticate("admin", "wrong")
    assert result.success == False
    assert result.error is not None
```

### Property-Based Tests

Test universal properties:

```python
# tests/property/test_auth_properties.py
@given(username=st.text(), password=st.text())
async def test_property_1_jwt_token_generation(username, password):
    # For any valid credentials, token should expire in 24 hours
    pass
```

### Integration Tests

Test complete workflows:

```python
# tests/integration/test_operations_api.py
async def test_operation_execution_workflow():
    # 1. Submit operation
    # 2. Check status
    # 3. Stream events
    # 4. Verify completion
    pass
```

## Validation Checklist

Before considering implementation complete, verify:

### Functionality
- [ ] All 65 acceptance criteria are met
- [ ] All API endpoints work correctly
- [ ] Frontend integrates successfully
- [ ] Git sync works with example repository
- [ ] SSH connections work to test machines
- [ ] Enrollment verification works
- [ ] Script execution works
- [ ] SSE streaming works
- [ ] WebSocket terminals work

### Testing
- [ ] All 37 property-based tests pass (100 iterations each)
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] Code coverage: 85%+ line, 80%+ branch

### Security
- [ ] JWT authentication works
- [ ] Account lockout works (5 attempts)
- [ ] Enrollment verification enforced
- [ ] SSH key permissions validated (600)
- [ ] Secrets not in Git

### Deployment
- [ ] Service installs successfully
- [ ] Service starts automatically
- [ ] Service restarts on failure
- [ ] Logs are written correctly
- [ ] Configuration loads correctly

### Documentation
- [ ] API documentation complete
- [ ] Deployment documentation complete
- [ ] All code is commented
- [ ] README files are accurate

## Common Pitfalls to Avoid

### 1. SSH Key Permissions
```python
# WRONG: Don't skip permission check
ssh_key = "/var/lib/linkops/keys/key"

# RIGHT: Always verify 600 permissions
if os.stat(ssh_key).st_mode & 0o777 != 0o600:
    raise PermissionError(f"SSH key {ssh_key} must have 600 permissions")
```

### 2. Enrollment Verification
```python
# WRONG: Don't skip enrollment check
await execute_script(script, link)

# RIGHT: Always verify enrollment first
if not await verify_enrollment(link):
    raise EnrollmentError(f"Machine {link.id} is not enrolled")
await execute_script(script, link)
```

### 3. Error Handling
```python
# WRONG: Don't let errors crash the service
result = await ssh_connection.run(command)

# RIGHT: Always handle errors gracefully
try:
    result = await ssh_connection.run(command)
except asyncssh.Error as e:
    logger.error(f"SSH error: {e}")
    return ExecutionResult(success=False, error=str(e))
```

### 4. Resource Cleanup
```python
# WRONG: Don't leave connections open
connection = await asyncssh.connect(host)
result = await connection.run(command)

# RIGHT: Always clean up resources
connection = await asyncssh.connect(host)
try:
    result = await connection.run(command)
finally:
    connection.close()
```

### 5. Concurrency Control
```python
# WRONG: Don't run unlimited parallel executions
for target in targets:
    await execute_script(script, target)

# RIGHT: Respect concurrency limits
semaphore = asyncio.Semaphore(concurrency)
async def execute_with_limit(target):
    async with semaphore:
        await execute_script(script, target)
await asyncio.gather(*[execute_with_limit(t) for t in targets])
```

## Debugging Tips

### Enable Debug Logging
```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

### Test SSH Connections Manually
```bash
sudo -u linkops ssh -i /var/lib/linkops/keys/key user@host
```

### Test Git Access Manually
```bash
sudo -u linkops git ls-remote git@github.com:org/repo.git
```

### Check Database
```bash
sudo -u linkops sqlite3 /var/lib/linkops/linkops.db ".tables"
```

### Monitor Logs
```bash
sudo journalctl -u linkopsd -f
```

## Success Criteria

The implementation is complete when:

1. ✅ All 28 tasks in `tasks.md` are completed
2. ✅ All 65 acceptance criteria in `requirements.md` are met
3. ✅ All 37 property-based tests pass
4. ✅ Frontend integrates successfully with backend
5. ✅ Service deploys successfully to Ubuntu LXC
6. ✅ All security requirements are met
7. ✅ Documentation is complete

## Getting Help

If you encounter issues:

1. **Check the specification**: `.kiro/specs/linkops-backend-api/`
2. **Review design document**: Detailed interfaces and data models
3. **Check integration guide**: `BACKEND_INTEGRATION_GUIDE.md`
4. **Review example repository**: `git-repo-example/`
5. **Check deployment guide**: `deployment/README.md`

## Final Notes

- **Follow the specification exactly** - Don't deviate from the design
- **Write tests as you go** - Don't leave testing for the end
- **Validate continuously** - Check acceptance criteria after each task
- **Document as you build** - Update API docs and comments
- **Ask for clarification** - If anything is unclear, ask before implementing

The specification is comprehensive and complete. You have everything you need to build a production-ready backend API. Follow the tasks sequentially, validate against acceptance criteria, and test thoroughly.

**Good luck! 🚀**

---

**Guide Version:** 1.0  
**Last Updated:** January 28, 2026  
**For:** AI Implementation of LinkOps Backend API v1.0
