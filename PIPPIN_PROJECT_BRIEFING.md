# LinkOps Project - Complete Briefing for Pippin AI

**Date:** January 30, 2026  
**Project:** LinkOps - SSH Orchestration Platform  
**Status:** Phase 1 Onboarding 95% Complete, Backend API Ready for Implementation  
**Your Role:** Help with backend implementation and testing

---

## 🎯 Project Overview

LinkOps is a secure SSH orchestration and bash script execution platform for SnS Network Solutions. It provides a modern web interface for managing infrastructure, executing scripts across multiple machines, and monitoring operations in real-time.

**Key Concept:** This is an internal tool (like Ansible/Terraform) that lets administrators manage multiple servers through a web interface.

---

## 📊 Current Status

### ✅ What's Complete
- **Frontend:** 100% complete with all 4 tabs (Overview, Links, Operations, Terminal)
- **Specification:** Fully documented with requirements, design, and implementation tasks
- **Deployment:** Scripts and systemd service ready
- **Phase 1 Onboarding:** 95% complete (user registration, Git setup, machine enrollment)

### 🚧 What's In Progress
- **Backend API:** Core implementation needed (28 tasks, ~98 hours estimated)
- **Testing:** Property-based tests and integration tests needed
- **Documentation:** API docs to be created after implementation

### ⚠️ Current Issues
1. Login password issue for user `samueljamesinc`
2. Step 3 frontend validation causing 422 errors (backend works via curl)

---

## 🏗️ Architecture

```
Frontend (HTML/CSS/JS) → Nginx Proxy → Backend API (FastAPI) → SSH → Target Machines
                                    ↓
                                SQLite Database
                                    ↓
                                Git Repository (inventory + scripts)
```

### Components
1. **Frontend:** Vanilla JavaScript, WebSocket, Server-Sent Events
2. **Backend:** FastAPI (Python 3.11+), asyncssh, GitPython, SQLite
3. **Database:** SQLite with 8 tables (users, machines, operations, etc.)
4. **Git Sync:** Pulls inventory (links.yaml) and scripts (scripts.yaml) every 15 minutes
5. **SSH Orchestration:** Executes bash scripts on enrolled machines
6. **Terminal:** Multi-pane WebSocket-based SSH sessions

---

## 📁 Project Structure

```
linkops/
├── frontend/                    # ✅ Complete
│   ├── index.html              # Main dashboard
│   ├── login.html              # Admin login
│   ├── onboarding-step1.html   # User registration
│   ├── onboarding-step2.html   # Git setup
│   ├── onboarding-step3.html   # Machine enrollment
│   ├── css/                    # 6 stylesheets
│   ├── js/                     # 6 JavaScript modules
│   └── assets/                 # Images, logos, backgrounds
│
├── backend/                     # 🚧 To Be Built
│   ├── main.py                 # FastAPI entry point
│   ├── config.py               # Configuration management
│   ├── requirements.txt        # ✅ Dependencies listed
│   ├── api/                    # API endpoints (7 files)
│   ├── services/               # Business logic (8 files)
│   ├── db/                     # Database layer (4 files)
│   ├── middleware/             # Auth & error handling (2 files)
│   └── parsers/                # YAML parsers (1 file)
│
├── deployment/                  # ✅ Complete
│   ├── install.sh              # Automated installation
│   ├── uninstall.sh            # Automated uninstallation
│   ├── linkopsd.service        # Systemd service
│   └── config.ini.template     # Configuration template
│
├── docs/                        # ✅ Complete
│   ├── README.md
│   ├── PROJECT_STATUS.md
│   ├── PHASE_1_IMPLEMENTATION.md
│   ├── SESSION_SUMMARY_JAN29.md
│   └── guides/                 # Implementation guides
│
└── .kiro/specs/linkops-backend-api/  # ✅ Complete Specification
    ├── README.md               # Spec overview
    ├── requirements.md         # 13 requirements, 65 acceptance criteria
    ├── design.md               # Architecture, API, 37 correctness properties
    └── tasks.md                # 28 implementation tasks in 7 phases
```

---

## 🔑 Key Concepts

### 1. Enrollment-Based Security
- Target machines MUST have `/etc/linkops/client_id` file
- Client ID must match inventory (links.yaml)
- No operations allowed on unenrolled machines
- **Why:** Prevents accidental script execution on wrong machines

### 2. Git-Based Configuration
- Machine inventory in `links.yaml` (10 machines in example)
- Script catalog in `scripts.yaml` (15 scripts in example)
- Secrets in `secrets.ini` (NOT in version control)
- Auto-sync every 15 minutes

### 3. Multi-Pane Terminals
- 4 layouts: single, grid2x2, grid1x3, grid2x1
- Each pane = separate SSH PTY session
- WebSocket for bidirectional I/O
- Multiple workspaces supported

### 4. Real-Time Operation Monitoring
- Server-Sent Events (SSE) for live output
- Script execution on multiple machines
- Concurrency control (parallel execution limit)
- Complete audit trail

---

## 🛠️ Technology Stack

### Backend (To Be Built)
- **Framework:** FastAPI 0.104+ (async ASGI)
- **SSH:** asyncssh 2.14+ (async SSH client)
- **Git:** GitPython 3.1+ (Git operations)
- **Database:** SQLite 3 with aiosqlite (async)
- **Auth:** python-jose (JWT tokens)
- **Server:** uvicorn (ASGI server)
- **Testing:** pytest, Hypothesis (property-based testing)
- **YAML:** PyYAML 6.0+

### Frontend (Complete)
- Vanilla JavaScript (ES6+)
- WebSocket for terminals
- Server-Sent Events for operations
- No frameworks

### Deployment
- Ubuntu 24.04 LTS
- Systemd service
- Nginx Proxy Manager
- 10GB SSD storage

---

## 📋 Implementation Tasks (28 Total)

### Phase 1: Project Setup and Authentication (9 hours)
1.1. Initialize FastAPI project structure  
1.2. Implement database schema and migrations  
1.3. Implement JWT authentication  

### Phase 2: Git Sync and Inventory (14 hours)
2.1. Implement Git sync engine  
2.2. Implement links/inventory management  
2.3. Implement enrollment verification  

### Phase 3: SSH Orchestration (19 hours)
3.1. Implement SSH connection management  
3.2. Implement SSH orchestrator  
3.3. Implement operations API endpoints  
3.4. Implement Server-Sent Events for operations  

### Phase 4: Terminal Sessions (14 hours)
4.1. Implement terminal manager  
4.2. Implement WebSocket handler  
4.3. Implement terminal API endpoints  

### Phase 5: Table Queries and Health (9 hours)
5.1. Implement table query engine  
5.2. Implement health monitoring  

### Phase 6: Configuration and Deployment (15 hours)
6.1. Implement configuration management  
6.2. Implement error handling and logging  
6.3. Implement operation history and audit trail  
6.4. Create systemd service  
6.5. Create deployment scripts  

### Phase 7: Testing and Documentation (18 hours)
7.1. Complete property-based tests (37 properties)  
7.2. Complete integration tests  
7.3. Create API documentation  
7.4. Create deployment documentation  

**Total:** 98 hours (~12-13 working days)

---

## 🧪 Testing Strategy

### Property-Based Testing (37 Properties)
Using Hypothesis library to test universal properties:

**Examples:**
- Property 1: JWT tokens expire exactly 24 hours from issuance
- Property 11: Enrollment verification compares client IDs correctly
- Property 18: Concurrency limits parallel executions
- Property 23: WebSocket routes I/O bidirectionally

**Format:**
```python
from hypothesis import given, settings, strategies as st

@settings(max_examples=100)
@given(username=st.text(), password=st.text())
async def test_property_1_jwt_token_generation(username, password):
    """
    Feature: linkops-backend-api, Property 1
    For any valid credentials, authenticating should return a JWT token
    that expires exactly 24 hours from issuance.
    """
    # Test implementation
```

### Coverage Goals
- Line coverage: 85%+
- Branch coverage: 80%+
- Property test coverage: 100%
- Integration test coverage: All endpoints

---

## 🔐 Security Requirements

1. **JWT Authentication**
   - 24-hour token expiration
   - Account lockout after 5 failed attempts (5 minutes)

2. **Enrollment Verification**
   - All operations require enrolled machines
   - Client ID validation via SSH

3. **SSH Key Management**
   - Keys stored in `/var/lib/linkops/keys/`
   - Must have 600 permissions
   - Never in Git repository

4. **Secrets Management**
   - `secrets.ini` synced from Git but NOT in version control
   - Configuration validated on startup

---

## 📡 API Endpoints Summary

### Authentication
- `POST /api/auth/login` - Get JWT token

### Inventory
- `GET /api/links` - Get all machines
- `GET /api/links/{id}` - Get specific machine
- `POST /api/links/{id}/verify` - Verify enrollment

### Operations
- `POST /api/operations/run` - Execute scripts
- `GET /api/operations/{id}` - Get operation status
- `GET /api/operations/{id}/events` - Stream events (SSE)
- `POST /api/operations/{id}/stop` - Stop operation

### Terminal
- `POST /api/terminal/workspaces` - Create workspace
- `PUT /api/terminal/workspaces/{id}/panes` - Assign panes
- `POST /api/terminal/workspaces/{id}/connect-all` - Connect all panes
- `WS /api/terminal/workspaces/{id}/ws` - WebSocket connection

### Table Queries
- `POST /api/tables/query` - Unified table query

### Git Sync
- `GET /api/git/status` - Get sync status
- `POST /api/git/sync` - Trigger sync

---

## 🗄️ Database Schema (8 Tables)

1. **machines** - Machine inventory from links.yaml
2. **scripts** - Script catalog from scripts.yaml
3. **operations** - Script execution records
4. **operation_logs** - Execution logs per machine
5. **terminal_workspaces** - Terminal sessions
6. **terminal_panes** - Pane assignments
7. **auth_attempts** - Failed login tracking
8. **git_sync_history** - Sync tracking

---

## 📂 File System Layout

```
/etc/linkops/
├── config.ini              # Main configuration
└── secrets.ini             # Synced from Git (not in version control)

/var/lib/linkops/
├── linkops.db              # SQLite database
├── keys/                   # SSH private keys (600 permissions)
├── ssh/known_hosts         # SSH known hosts
├── git-repo/               # Cloned Git repository
└── logs/api.log            # Application logs

/var/log/linkops/
└── api.log                 # Symlink to /var/lib/linkops/logs/api.log
```

---

## 🚀 Deployment Environment

### Current Setup
- **Server:** Ubuntu 24.04 LXC container
- **IP:** 10.0.1.107 (internal)
- **Domain:** linkops.snsnetlabs.com (HTTPS via Nginx Proxy Manager)
- **Backend Port:** 8000 (linkopsd.service)
- **Frontend Port:** 3000 (Python HTTP server)

### Nginx Routing
- `/api/*` → Backend (port 8000)
- `/*` → Frontend (port 3000)

### Service Management
```bash
# Status
sudo systemctl status linkopsd

# Restart
sudo systemctl restart linkopsd

# Logs
sudo journalctl -u linkopsd -f
```

---

## 📖 Key Documentation Files

### For Understanding the Project
1. `README.md` - Project overview and quick start
2. `docs/PROJECT_STATUS.md` - Complete status report
3. `docs/SESSION_SUMMARY_JAN29.md` - Latest development session

### For Implementation
1. `.kiro/specs/linkops-backend-api/requirements.md` - What to build (65 acceptance criteria)
2. `.kiro/specs/linkops-backend-api/design.md` - How to build it (architecture, API, properties)
3. `.kiro/specs/linkops-backend-api/tasks.md` - Order to build it (28 tasks)

### For Integration
1. `docs/guides/BACKEND_INTEGRATION_GUIDE.md` - Frontend integration
2. `docs/guides/AI_IMPLEMENTATION_GUIDE.md` - AI implementation guide

---

## 🎯 What You Can Help With

### 1. Backend Implementation
- Follow tasks.md sequentially (Phase 1 → Phase 7)
- Implement FastAPI endpoints
- Write business logic services
- Create database layer

### 2. Testing
- Write property-based tests using Hypothesis
- Write integration tests for API endpoints
- Achieve coverage goals (85% line, 80% branch)

### 3. Debugging
- Fix current login password issue
- Fix Step 3 frontend validation errors
- Test end-to-end onboarding flow

### 4. Documentation
- Create API documentation (OpenAPI/Swagger)
- Document WebSocket protocol
- Create troubleshooting guides

---

## 🔍 Current Issues to Fix

### Issue #1: Login Password Not Working
- **User:** samueljamesinc
- **Problem:** Password not working after registration
- **Options:**
  - Reset password in database
  - Delete user and re-register
  - Add password reset functionality

### Issue #2: Step 3 Frontend Validation
- **Problem:** Frontend sending incorrect data format (422 errors)
- **Backend:** Works via curl
- **Need:** Debug request payload, compare to working curl request

---

## 💡 Development Tips

### Testing Backend Endpoints
```bash
# Test registration
curl -X POST http://10.0.1.107:8000/api/onboarding/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "firstName": "Test",
    "lastName": "User",
    "password": "SecurePass123!"
  }'

# Check database
ssh linkops "sqlite3 /var/lib/linkops/linkops.db 'SELECT * FROM users;'"
```

### Deploying Changes
```bash
# Copy backend files
scp backend/api/onboarding.py linkops:/opt/linkops/backend/api/

# Restart service
ssh linkops "systemctl restart linkopsd"

# Check logs
ssh linkops "journalctl -u linkopsd -f"
```

---

## 📚 Additional Resources

### Example Git Repository
- `git-repo-example/links.yaml` - 10 example machines
- `git-repo-example/scripts.yaml` - 15 example scripts
- `git-repo-example/secrets.ini` - Secrets template

### Demo Data
- Frontend has demo data for all features
- Backend needs to match frontend expectations
- See `BACKEND_INTEGRATION_GUIDE.md` for response formats

---

## ✅ Success Criteria

Implementation is complete when:
- ✅ All 65 acceptance criteria met
- ✅ All 37 property-based tests pass (100 iterations each)
- ✅ All integration tests pass
- ✅ Code coverage: 85%+ line, 80%+ branch
- ✅ Service deploys successfully to Ubuntu LXC
- ✅ Frontend integrates successfully with backend
- ✅ All security requirements met
- ✅ Documentation complete

---

## 🤝 Working Together

### Communication
- Ask questions about requirements, design, or tasks
- Request clarification on acceptance criteria
- Suggest improvements or alternatives

### Workflow
1. Read specification documents first
2. Follow tasks sequentially
3. Validate against acceptance criteria
4. Write tests as you go
5. Deploy and test incrementally

### Code Quality
- Follow Python best practices (PEP 8)
- Write docstrings for all functions
- Use type hints
- Handle errors gracefully
- Log important events

---

## 📞 Next Steps

1. **Review this briefing** - Ask questions if anything is unclear
2. **Read specification files** - Start with requirements.md, then design.md, then tasks.md
3. **Choose a starting point** - Phase 1 (authentication) or fix current issues
4. **Implement incrementally** - One task at a time, test as you go
5. **Deploy and validate** - Test on actual server, verify with frontend

---

**Welcome to the LinkOps project! Let's build something great together.**

---

**Document Version:** 1.0  
**Last Updated:** January 30, 2026  
**Status:** Ready for Pippin AI
