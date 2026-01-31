# LinkOps Deployment Plan - January 28, 2026

## Resource Verification ✓

### Current LXC-107 (linkops) Resources
- **CPU:** 2 cores ✓
- **RAM:** 1GB allocated (27GB available on host) ✓
- **Disk:** 12GB total, 11GB free ✓
- **Python:** 3.12.3 ✓
- **OS:** Ubuntu (confirmed)

### Resource Recommendations
**Current allocation is sufficient** for development and testing. For production:
- Consider increasing RAM to 2GB if handling 10+ concurrent operations
- Disk space is adequate (backend + database ~500MB)

---

## Pre-Deployment Setup (Do Now)

### 1. Install Missing Dependencies
```bash
ssh mtr "pct exec 107 -- apt update"
ssh mtr "pct exec 107 -- apt install -y git openssh-client sqlite3 python3-pip python3-venv"
```

### 2. Verify Installation
```bash
ssh mtr "pct exec 107 -- bash -c 'git --version && ssh -V && sqlite3 --version'"
```

### 3. Create Directory Structure
```bash
ssh mtr "pct exec 107 -- bash -c '
mkdir -p /opt/linkops
mkdir -p /etc/linkops
mkdir -p /var/lib/linkops/{keys,ssh,git-repo,logs}
mkdir -p /var/log/linkops
'"
```

---

## Code Review Process

### Phase 1: Project Structure Review (15 min)
**Objective:** Verify all files are present and organized correctly

```bash
# List project structure
ssh mtr "pct exec 107 -- find /root/linkops -type f -name '*.py' -o -name '*.md' -o -name '*.yaml' -o -name '*.sh' | sort"

# Count files by type
ssh mtr "pct exec 107 -- bash -c 'cd /root/linkops && echo \"Python files:\" && find . -name \"*.py\" | wc -l && echo \"Markdown docs:\" && find . -name \"*.md\" | wc -l && echo \"Shell scripts:\" && find . -name \"*.sh\" | wc -l'"
```

**Review Checklist:**
- [ ] Backend directory exists with main.py
- [ ] API endpoints directory (api/)
- [ ] Services directory (services/)
- [ ] Database directory (db/)
- [ ] Deployment scripts present
- [ ] Frontend files present
- [ ] Specification documents present

### Phase 2: Specification Review (30 min)
**Objective:** Understand requirements, design, and implementation tasks

```bash
# Read key specification files
ssh mtr "pct exec 107 -- cat /root/linkops/.kiro/specs/linkops-backend-api/requirements.md" | less
ssh mtr "pct exec 107 -- cat /root/linkops/.kiro/specs/linkops-backend-api/design.md" | less
ssh mtr "pct exec 107 -- cat /root/linkops/.kiro/specs/linkops-backend-api/tasks.md" | less
```

**Review Focus:**
- [ ] 13 requirements clearly defined
- [ ] 65 acceptance criteria documented
- [ ] 37 correctness properties for testing
- [ ] 28 implementation tasks organized in 7 phases
- [ ] Dependencies between tasks identified

### Phase 3: Backend Code Review (60 min)
**Objective:** Review implementation quality, security, and completeness

#### 3.1 Check if Backend Code Exists
```bash
ssh mtr "pct exec 107 -- ls -la /root/linkops/backend/"
```

**If backend code exists:**

#### 3.2 Review Main Application Entry Point
```bash
ssh mtr "pct exec 107 -- cat /root/linkops/backend/main.py"
```
**Check for:**
- [ ] FastAPI app initialization
- [ ] CORS middleware configuration
- [ ] Router inclusion (auth, links, operations, terminal, tables, git)
- [ ] Startup/shutdown event handlers
- [ ] Health check endpoint
- [ ] Error handling middleware

#### 3.3 Review Authentication Service
```bash
ssh mtr "pct exec 107 -- cat /root/linkops/backend/services/auth_service.py"
```
**Check for:**
- [ ] JWT token generation (24-hour expiration)
- [ ] Password hashing (bcrypt or similar)
- [ ] Account lockout logic (5 attempts, 5 minutes)
- [ ] Token validation
- [ ] Secure secret handling

#### 3.4 Review Database Schema
```bash
ssh mtr "pct exec 107 -- cat /root/linkops/backend/db/schema.sql"
```
**Check for:**
- [ ] 8 required tables (users, machines, scripts, operations, etc.)
- [ ] Proper indexes for performance
- [ ] Foreign key constraints
- [ ] Timestamp fields (created_at, updated_at)

#### 3.5 Review Git Sync Engine
```bash
ssh mtr "pct exec 107 -- cat /root/linkops/backend/services/git_sync_engine.py"
```
**Check for:**
- [ ] Git clone/pull logic
- [ ] YAML parsing (links.yaml, scripts.yaml)
- [ ] Periodic sync (15-minute interval)
- [ ] Error handling for Git failures
- [ ] Database update after sync

#### 3.6 Review SSH Orchestrator
```bash
ssh mtr "pct exec 107 -- cat /root/linkops/backend/services/ssh_orchestrator.py"
```
**Check for:**
- [ ] asyncssh connection management
- [ ] Concurrency control (parallel execution limit)
- [ ] Real-time output capture
- [ ] Exit code tracking
- [ ] Timeout handling
- [ ] Connection pooling

#### 3.7 Review Terminal Manager
```bash
ssh mtr "pct exec 107 -- cat /root/linkops/backend/services/terminal_manager.py"
```
**Check for:**
- [ ] WebSocket connection handling
- [ ] PTY session management
- [ ] Multi-pane support (1-4 panes)
- [ ] Bidirectional I/O
- [ ] Session cleanup on disconnect

#### 3.8 Review Enrollment Verifier
```bash
ssh mtr "pct exec 107 -- cat /root/linkops/backend/services/enrollment_verifier.py"
```
**Check for:**
- [ ] Client ID file reading (/etc/linkops/client_id)
- [ ] Comparison with inventory
- [ ] Enrollment status caching
- [ ] Error handling for unreachable machines

#### 3.9 Review API Endpoints
```bash
# Check all API endpoint files
for file in auth links operations terminal tables git; do
  echo "=== $file.py ==="
  ssh mtr "pct exec 107 -- cat /root/linkops/backend/api/$file.py" | head -50
done
```
**Check for:**
- [ ] Proper HTTP methods (GET, POST, PUT, DELETE)
- [ ] Request/response models (Pydantic)
- [ ] Authentication middleware
- [ ] Error responses (4xx, 5xx)
- [ ] Input validation

#### 3.10 Review Configuration Management
```bash
ssh mtr "pct exec 107 -- cat /root/linkops/backend/config.py"
ssh mtr "pct exec 107 -- cat /root/linkops/deployment/config.ini.template"
```
**Check for:**
- [ ] Configuration file parsing
- [ ] Environment variable support
- [ ] Validation on startup
- [ ] Secure secret handling (JWT secret, SSH keys)

### Phase 4: Security Review (30 min)
**Objective:** Identify security vulnerabilities

**Security Checklist:**
- [ ] JWT secrets are randomly generated (not hardcoded)
- [ ] SSH keys have 600 permissions
- [ ] Passwords are hashed (never stored plaintext)
- [ ] SQL injection prevention (parameterized queries)
- [ ] Command injection prevention (no shell=True with user input)
- [ ] Path traversal prevention (validate file paths)
- [ ] Rate limiting on authentication endpoint
- [ ] CORS properly configured
- [ ] Secrets not logged
- [ ] Enrollment verification enforced

**Run Security Scan:**
```bash
# Check for hardcoded secrets
ssh mtr "pct exec 107 -- grep -r 'password.*=.*[\"']' /root/linkops/backend/ || echo 'No hardcoded passwords found'"

# Check for shell=True usage
ssh mtr "pct exec 107 -- grep -r 'shell=True' /root/linkops/backend/ || echo 'No shell=True found'"

# Check for SQL string concatenation
ssh mtr "pct exec 107 -- grep -r 'execute.*%.*format' /root/linkops/backend/ || echo 'No SQL concatenation found'"
```

### Phase 5: Testing Review (30 min)
**Objective:** Verify test coverage and quality

```bash
# Check if tests exist
ssh mtr "pct exec 107 -- ls -la /root/linkops/tests/"

# Count test files
ssh mtr "pct exec 107 -- find /root/linkops/tests -name 'test_*.py' | wc -l"
```

**Testing Checklist:**
- [ ] Unit tests for each service
- [ ] Property-based tests (37 properties)
- [ ] Integration tests for API endpoints
- [ ] WebSocket tests
- [ ] SSE tests
- [ ] Authentication tests
- [ ] Database tests

**If tests exist, review sample:**
```bash
ssh mtr "pct exec 107 -- cat /root/linkops/tests/property/test_properties.py" | head -100
```

### Phase 6: Deployment Scripts Review (20 min)
**Objective:** Verify installation and service scripts

```bash
# Review installation script
ssh mtr "pct exec 107 -- cat /root/linkops/deployment/install.sh"

# Review systemd service
ssh mtr "pct exec 107 -- cat /root/linkops/deployment/linkopsd.service"

# Review uninstall script
ssh mtr "pct exec 107 -- cat /root/linkops/deployment/uninstall.sh"
```

**Deployment Checklist:**
- [ ] User creation (linkops user)
- [ ] Directory creation with proper permissions
- [ ] Virtual environment setup
- [ ] Dependency installation
- [ ] Service file installation
- [ ] Service enable/start commands
- [ ] Rollback/uninstall capability

### Phase 7: Frontend Integration Review (20 min)
**Objective:** Verify frontend can communicate with backend

```bash
# Check frontend API configuration
ssh mtr "pct exec 107 -- grep -r 'API_BASE_URL\|fetch.*api' /root/linkops/frontend/js/" | head -20
```

**Integration Checklist:**
- [ ] API base URL configurable
- [ ] JWT token storage (localStorage)
- [ ] Token included in requests (Authorization header)
- [ ] WebSocket URL matches backend
- [ ] SSE EventSource configured
- [ ] Error handling for API failures

---

## Testing Plan (Before Deployment)

### Test 1: Syntax Validation (5 min)
```bash
# Check Python syntax for all files
ssh mtr "pct exec 107 -- bash -c 'cd /root/linkops/backend && find . -name \"*.py\" -exec python3 -m py_compile {} \; && echo \"All Python files valid\"'"
```

### Test 2: Dependency Check (5 min)
```bash
# Check if requirements.txt exists
ssh mtr "pct exec 107 -- cat /root/linkops/backend/requirements.txt"

# Verify all required packages are listed
# Expected: fastapi, uvicorn, asyncssh, gitpython, aiosqlite, python-jose, pyyaml, pytest, hypothesis
```

### Test 3: Database Schema Validation (5 min)
```bash
# Test database creation
ssh mtr "pct exec 107 -- bash -c 'cd /tmp && sqlite3 test.db < /root/linkops/backend/db/schema.sql && sqlite3 test.db \".tables\" && rm test.db'"
```

### Test 4: Configuration Template Validation (5 min)
```bash
# Verify config template has all required sections
ssh mtr "pct exec 107 -- grep -E '^\[.*\]$' /root/linkops/deployment/config.ini.template"

# Expected sections: [api], [git], [ssh], [security], [logging]
```

### Test 5: Git Repository Structure (10 min)
```bash
# Check example Git repository structure
ssh mtr "pct exec 107 -- ls -la /root/linkops/git-repo-example/"

# Verify links.yaml and scripts.yaml exist
ssh mtr "pct exec 107 -- cat /root/linkops/git-repo-example/links.yaml" | head -30
ssh mtr "pct exec 107 -- cat /root/linkops/git-repo-example/scripts.yaml" | head -30
```

---

## Code Quality Metrics

### Complexity Analysis
```bash
# Count lines of code
ssh mtr "pct exec 107 -- bash -c 'cd /root/linkops/backend && find . -name \"*.py\" -exec wc -l {} + | tail -1'"

# Count functions/classes
ssh mtr "pct exec 107 -- bash -c 'cd /root/linkops/backend && grep -r \"^def \\|^class \" --include=\"*.py\" | wc -l'"
```

### Documentation Coverage
```bash
# Check for docstrings
ssh mtr "pct exec 107 -- bash -c 'cd /root/linkops/backend && grep -r \"\\\"\\\"\\\"\" --include=\"*.py\" | wc -l'"
```

---

## Issues to Watch For

### Common Backend Issues
1. **Missing async/await** - All I/O operations must be async
2. **Blocking calls** - No time.sleep(), use asyncio.sleep()
3. **Resource leaks** - SSH connections, file handles must be closed
4. **Race conditions** - Proper locking for shared state
5. **Unhandled exceptions** - Try/except blocks for all external calls

### Common Security Issues
1. **Hardcoded credentials** - Must use config files
2. **Weak JWT secrets** - Must be 32+ random bytes
3. **Missing input validation** - All user input must be validated
4. **Command injection** - Never use shell=True with user input
5. **Path traversal** - Validate all file paths

### Common Deployment Issues
1. **Wrong Python version** - Must be 3.11+ (we have 3.12.3 ✓)
2. **Missing dependencies** - requirements.txt must be complete
3. **Permission errors** - Files/directories must have correct ownership
4. **Port conflicts** - Port 8000 must be available
5. **Service startup failures** - Check systemd service file

---

## Pre-Deployment Checklist

### Environment Setup
- [ ] Install git, openssh-client, sqlite3
- [ ] Create linkops user
- [ ] Create directory structure
- [ ] Set proper permissions

### Code Review Complete
- [ ] All Python files have valid syntax
- [ ] Security review passed
- [ ] No hardcoded secrets
- [ ] All required files present
- [ ] Configuration template valid

### Testing Complete
- [ ] Database schema creates successfully
- [ ] Dependencies list is complete
- [ ] Example Git repository structure valid
- [ ] No obvious bugs in code review

### Documentation Review
- [ ] README.md is clear and complete
- [ ] Deployment guide is accurate
- [ ] API documentation exists
- [ ] Troubleshooting guide exists

---

## Tonight's Deployment Steps (Estimated 2 hours)

### Step 1: Environment Setup (20 min)
```bash
# Install dependencies
ssh mtr "pct exec 107 -- apt update && apt install -y git openssh-client sqlite3 python3-pip python3-venv"

# Create linkops user
ssh mtr "pct exec 107 -- useradd -r -s /bin/false -d /var/lib/linkops linkops"

# Create directories
ssh mtr "pct exec 107 -- bash -c '
mkdir -p /etc/linkops
mkdir -p /var/lib/linkops/{keys,ssh,git-repo,logs}
mkdir -p /var/log/linkops
chown -R linkops:linkops /var/lib/linkops
chown -R linkops:linkops /var/log/linkops
chown root:linkops /etc/linkops
chmod 750 /etc/linkops
'"
```

### Step 2: Copy Backend Code (10 min)
```bash
# Copy backend to /opt/linkops
ssh mtr "pct exec 107 -- bash -c '
mkdir -p /opt/linkops
cp -r /root/linkops/backend/* /opt/linkops/
chown -R linkops:linkops /opt/linkops
'"
```

### Step 3: Install Python Dependencies (15 min)
```bash
# Create virtual environment
ssh mtr "pct exec 107 -- bash -c '
cd /opt/linkops
sudo -u linkops python3 -m venv venv
sudo -u linkops venv/bin/pip install --upgrade pip
sudo -u linkops venv/bin/pip install -r requirements.txt
'"
```

### Step 4: Configure SSH Keys (10 min)
```bash
# Copy SSH keys (you'll need to provide the actual key path)
# Example:
# scp ~/.ssh/sns_prod_ed25519 mtr:/tmp/
# ssh mtr "pct push 107 /tmp/sns_prod_ed25519 /var/lib/linkops/keys/sns_prod_ed25519"
# ssh mtr "pct exec 107 -- bash -c 'chown linkops:linkops /var/lib/linkops/keys/sns_prod_ed25519 && chmod 600 /var/lib/linkops/keys/sns_prod_ed25519'"
```

### Step 5: Configure LinkOps (15 min)
```bash
# Copy config template
ssh mtr "pct exec 107 -- cp /root/linkops/deployment/config.ini.template /etc/linkops/config.ini"

# Generate JWT secret
JWT_SECRET=$(openssl rand -hex 32)
echo "JWT Secret: $JWT_SECRET"

# Update config (manual edit required)
ssh mtr "pct exec 107 -- nano /etc/linkops/config.ini"
# Update: jwt_secret, repository_url
```

### Step 6: Initialize Database (5 min)
```bash
# Run database initialization
ssh mtr "pct exec 107 -- sudo -u linkops /opt/linkops/venv/bin/python3 -c 'from backend.db.database import init_database; import asyncio; asyncio.run(init_database())'"

# Verify database
ssh mtr "pct exec 107 -- sudo -u linkops ls -lh /var/lib/linkops/linkops.db"
```

### Step 7: Install Systemd Service (10 min)
```bash
# Copy service file
ssh mtr "pct exec 107 -- cp /root/linkops/deployment/linkopsd.service /etc/systemd/system/"

# Reload systemd
ssh mtr "pct exec 107 -- systemctl daemon-reload"

# Enable service
ssh mtr "pct exec 107 -- systemctl enable linkopsd"

# Start service
ssh mtr "pct exec 107 -- systemctl start linkopsd"

# Check status
ssh mtr "pct exec 107 -- systemctl status linkopsd"
```

### Step 8: Verify Installation (15 min)
```bash
# Check service logs
ssh mtr "pct exec 107 -- journalctl -u linkopsd -n 50"

# Test health endpoint
ssh mtr "pct exec 107 -- curl http://localhost:8000/health"

# Test authentication
ssh mtr "pct exec 107 -- curl -X POST http://localhost:8000/api/auth/login -H 'Content-Type: application/json' -d '{\"username\":\"admin\",\"password\":\"admin\"}'"
```

### Step 9: Initial Git Sync (10 min)
```bash
# Get JWT token from previous step
TOKEN="<jwt-token-from-login>"

# Trigger sync
ssh mtr "pct exec 107 -- curl -X POST http://localhost:8000/api/git/sync -H 'Authorization: Bearer $TOKEN'"

# Check sync status
ssh mtr "pct exec 107 -- curl http://localhost:8000/api/git/status -H 'Authorization: Bearer $TOKEN'"

# Verify machines loaded
ssh mtr "pct exec 107 -- curl http://localhost:8000/api/links -H 'Authorization: Bearer $TOKEN'"
```

### Step 10: Frontend Configuration (10 min)
```bash
# Update frontend API URL (if needed)
# The frontend files are in /root/linkops/frontend/
# Update js/config.js or js/main.js with API_BASE_URL
```

---

## Rollback Plan

If deployment fails:
```bash
# Stop service
ssh mtr "pct exec 107 -- systemctl stop linkopsd"

# Disable service
ssh mtr "pct exec 107 -- systemctl disable linkopsd"

# Remove service file
ssh mtr "pct exec 107 -- rm /etc/systemd/system/linkopsd.service"

# Clean up (optional)
ssh mtr "pct exec 107 -- rm -rf /opt/linkops /var/lib/linkops /etc/linkops"
```

---

## Post-Deployment Monitoring

### Check Service Health
```bash
# Service status
ssh mtr "pct exec 107 -- systemctl status linkopsd"

# Recent logs
ssh mtr "pct exec 107 -- journalctl -u linkopsd -n 100"

# Follow logs
ssh mtr "pct exec 107 -- journalctl -u linkopsd -f"
```

### Monitor Resources
```bash
# CPU and memory
ssh mtr "pct exec 107 -- ps aux | grep linkops"

# Disk usage
ssh mtr "pct exec 107 -- du -sh /var/lib/linkops/*"

# Database size
ssh mtr "pct exec 107 -- ls -lh /var/lib/linkops/linkops.db"
```

---

## Next Steps After Deployment

1. **Test all API endpoints** - Use curl or Postman
2. **Test frontend integration** - Open frontend in browser
3. **Test SSH operations** - Execute a simple script
4. **Test terminal sessions** - Open WebSocket terminal
5. **Configure monitoring** - Set up log rotation, health checks
6. **Create backups** - Database, configuration, SSH keys
7. **Document any issues** - Update troubleshooting guide

---

**Plan Created:** January 28, 2026  
**Estimated Total Time:** 3-4 hours (code review + deployment)  
**Risk Level:** Low (resources adequate, comprehensive testing plan)
