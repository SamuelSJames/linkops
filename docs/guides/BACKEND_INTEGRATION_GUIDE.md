# LinkOps - Backend Integration Guide

## Project Overview
**LinkOps** is a secure SSH orchestration and bash script execution platform for SnS Network Solutions. The frontend is complete with 4 main tabs: Overview, Links, Operations, and Terminal.

---

## Current State (Frontend Complete)

### ✅ Completed Frontend Components

#### 1. **Login Screen** (`login.html`)
- Admin-only authentication
- Theme: Dark with `bg_admin_login.png` background
- Demo credentials: `admin` / `admin`
- Session management with JWT tokens
- Lockout protection (5 failed attempts = 5 min lockout)

#### 2. **Main Application** (`index.html`)
- **Top Bar:** LinkOps branding, theme selector (3 themes), Git sync status, user menu
- **Tab Navigation:** Overview, Links, Operations, Terminal
- **Footer:** SnS Network Solutions branding
- **Themes:** Gray Fabric (default), Blue Fabric, Charcoal Leather

#### 3. **Overview Tab**
- **Tables:**
  - `tbl_infrastructure` - Infrastructure summary (2 VPS, 1 Proxmox, 7 VMs)
  - `tbl_recent_activity` - Last 5 operations/SSH sessions
  - `tbl_link_health` - All 10 machines with status
- **Demo Data:** 10 machines with icons, enrollment IDs, SSH status, latency

#### 4. **Links Tab**
- **Two Views:**
  - **Table View:** Full machine details with enrollment IDs (LINKOPS-* format)
  - **Topology View:** Visual network diagram (VPS → Proxmox → VMs)
- **Features:** Search, filters, action buttons (Terminal, SSH, Info)

#### 5. **Operations Tab**
- **Three Sections:**
  - **Operations List:** History/Active toggle, recent operations
  - **Script Execution:** Multi-select scripts (1-10), flags, targets
  - **Connection Output:** Terminal-style output with color-coded status
- **Available Scripts:** 10 scripts (nano, vim, docker, nginx, crowdsec, wazuh, etc.)
- **Output Format:** `[Package #] - [PACKAGE NAME] - [SCRIPT NAME] - [STATUS]`

#### 6. **Terminal Tab**
- **4 Layout Options:** 1, 2, 3, or 4 panes (2×2 grid)
- **Features:** Connect All, individual connections, disconnect
- **Simulated SSH:** Connection status, enrollment verification, terminal output

---

## API Design & Table Structure

### Core Principle: "Excel Tables in a Web App"
Each "sheet" (tab) contains named tables that map directly to API endpoints.

### Table Naming Convention
All tables use `tbl_*` prefix for API reference:

```
OVERVIEW Sheet:
  - tbl_infrastructure
  - tbl_recent_activity
  - tbl_link_health

LINKS Sheet:
  - tbl_links

OPERATIONS Sheet:
  - tbl_operations (active)
  - tbl_operations_history

TERMINAL Sheet:
  - tbl_terminal_sessions
  - tbl_terminal_panes
```

### API Endpoint Structure

#### **Table Query Endpoint** (Primary Pattern)
```http
POST /api/tables/query
Content-Type: application/json

{
  "table": "tbl_links",
  "columns": ["status", "name", "type", "enrolled", "ssh", "latency"],
  "filters": [
    {"col": "type", "op": "in", "val": ["VPS", "VM"]},
    {"col": "enrolled", "op": "eq", "val": true}
  ],
  "sort": [{"col": "name", "dir": "asc"}],
  "page": {"size": 50, "cursor": null}
}

Response:
{
  "table": "tbl_links",
  "rows": [...],
  "page": {"size": 50, "next_cursor": "abc123"},
  "meta": {"as_of": "2026-01-27T17:02:10Z"}
}
```

#### **Authentication**
```http
POST /api/auth/login
{
  "username": "admin",
  "password": "admin"
}

Response:
{
  "success": true,
  "token": "jwt_token_here",
  "user": {"username": "admin", "role": "admin"}
}
```

#### **Links/Machines**
```http
GET /api/links
GET /api/links/{link_id}
POST /api/links/{link_id}/verify  # Check enrollment + SSH
```

#### **Operations/Script Execution**
```http
POST /api/operations/run
{
  "scripts": ["install_crowdsec", "install_wazuh"],
  "flags": {
    "install_crowdsec": ["--auto-config", "--enable-service"],
    "install_wazuh": ["--manager-ip", "--auto-enroll"]
  },
  "targets": ["vps-linode-01", "vm-ubuntu-web-01"],
  "concurrency": 5,
  "require_enrollment": true
}

Response:
{
  "operation_id": "OP-10292",
  "status": "queued"
}

GET /api/operations/{operation_id}
GET /api/operations/{operation_id}/events  # SSE for live updates
POST /api/operations/{operation_id}/stop
```

#### **Terminal/SSH Sessions**
```http
POST /api/terminal/workspaces
{
  "layout": "grid2x2",
  "max_panes": 4
}

Response:
{
  "workspace_id": "ws-abc123"
}

PUT /api/terminal/workspaces/{id}/panes
{
  "panes": [
    {"pane": "A", "target": "vps-linode-01"},
    {"pane": "B", "target": "vps-racknerd-01"}
  ]
}

POST /api/terminal/workspaces/{id}/connect-all

WS /api/terminal/workspaces/{id}/ws
Messages:
  Client → Server: {"pane": "A", "type": "stdin", "data": "ls -la\n"}
  Server → Client: {"pane": "A", "type": "stdout", "data": "..."}
```

#### **Git Sync**
```http
GET /api/git/status
POST /api/git/sync
```

---

## Data Models

### Machine/Link
```javascript
{
  id: "vps-linode-01",
  name: "vps-linode-01",
  type: "VPS",  // VPS | Proxmox | VM
  provider: "Linode",
  icon: "assets/logos/linode.svg",
  enrolled: true,
  enrollmentId: "LINKOPS-8f3a2c6d-1b7e-4c7a-9c2a-3f1a7d2c9c10",
  ssh: {
    host: "10.0.1.10",
    port: 22,
    user: "root",
    proxyJump: null,
    keyRef: "sns_prod_ed25519"
  },
  health: {
    reachable: true,
    latency: 45,
    lastSeen: 1738012800000
  },
  status: "online"
}
```

### Operation
```javascript
{
  id: "OP-10291",
  scripts: ["baseline"],
  targets: ["vps-linode-01", "vps-racknerd-01"],
  status: "success",  // queued | running | success | failed | partial
  started: 1738012800000,
  ended: 1738012868000,
  duration: 68000,
  result: {
    success: 2,
    failed: 0
  },
  logs: [...]
}
```

### Script Definition
```javascript
{
  id: "install_crowdsec",
  name: "Install CrowdSec",
  emoji: "🛡️",
  description: "Install and configure CrowdSec security engine",
  flags: ["--auto-config", "--enable-service", "--start-now"],
  estimatedDuration: 240
}
```

---

## Git Repository Structure

### Single Private Repo with 3 Files:

#### 1. **links.yaml** (Inventory)
```yaml
links:
  vps-linode-01:
    type: VPS
    provider: Linode
    host: 10.0.1.10
    port: 22
    user: root
    tags: [prod, vps]
    enrollment:
      required: true
      clientId: LINKOPS-8f3a2c6d-1b7e-4c7a-9c2a-3f1a7d2c9c10
    ssh:
      keyRef: sns_prod_ed25519
      proxyJump: null
```

#### 2. **scripts.yaml** (Script Catalog)
```yaml
scripts:
  install_crowdsec:
    name: Install CrowdSec
    description: Install and configure CrowdSec security engine
    path: scripts/install_crowdsec.sh
    flags:
      - --auto-config
      - --enable-service
      - --start-now
    estimatedDuration: 240
```

#### 3. **secrets.ini** (Secrets & Paths)
```ini
[ssh]
key_path=/var/lib/linkops/keys/ops_ed25519
known_hosts_path=/var/lib/linkops/ssh/known_hosts

[git]
token=ghp_xxxxxxxxxxxxx

[api]
ai_api_key=sk-xxxxxxxxxxxxx
```

---

## Frontend → Backend Integration Points

### JavaScript Files to Update:

#### **js/login.js**
- Replace `authenticateUser()` demo logic with real API call
- Update to use `/api/auth/login`

#### **js/overview.js**
- Replace `DEMO_MACHINES` with API call to `/api/tables/query` (table: `tbl_links`)
- Replace `DEMO_OPERATIONS_HISTORY` with API call (table: `tbl_recent_activity`)
- Add auto-refresh every 30 seconds

#### **js/links.js**
- Replace `linksMachines` with API call to `/api/links`
- Update filters to call API with query parameters
- Wire up action buttons (Terminal, SSH, Info) to real functions

#### **js/operations.js**
- Replace `DEMO_OPERATIONS_HISTORY` with API call (table: `tbl_operations_history`)
- Update `executeScripts()` to call `/api/operations/run`
- Connect to SSE endpoint `/api/operations/{id}/events` for live output
- Parse SSE events and update terminal output in real-time

#### **js/terminal.js**
- Update `connectPane()` to call `/api/terminal/workspaces` and `/api/terminal/workspaces/{id}/panes`
- Replace simulated SSH with WebSocket connection to `/api/terminal/workspaces/{id}/ws`
- Handle WebSocket messages for stdin/stdout streaming

---

## Security & Enrollment Model

### Trust Model:
1. **Target must have client ID file:** `/etc/linkops/client_id`
2. **Client ID must match inventory:** Value in file = value in `links.yaml`
3. **SSH key must authenticate:** Server uses mounted key to connect
4. **Execution gated by enrollment:** Operations only run on enrolled machines

### Enrollment ID Format:
```
LINKOPS-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
Example: LINKOPS-8f3a2c6d-1b7e-4c7a-9c2a-3f1a7d2c9c10
```

---

## Backend Technology Stack (Recommended)

### Option 1: Python (FastAPI)
```
- FastAPI (async API framework)
- asyncssh (SSH connections)
- GitPython (Git sync)
- SQLite/PostgreSQL (database)
- uvicorn (ASGI server)
```

### Option 2: Go
```
- Gin/Echo (web framework)
- golang.org/x/crypto/ssh (SSH)
- go-git (Git sync)
- SQLite/PostgreSQL (database)
```

---

## Deployment Target

- **Environment:** Ubuntu 24 LXC container
- **Storage:** 10GB SSD
- **Service:** `linkopsd` (systemd service)
- **Config:** `/etc/linkops/`
- **Data:** `/var/lib/linkops/`
- **SSH Keys:** `/var/lib/linkops/keys/` (600 permissions)

---

## Next Steps for Backend Integration

### Phase 1: Authentication & Core API
1. Set up FastAPI/Go project structure
2. Implement `/api/auth/login` with JWT
3. Create database schema (SQLite)
4. Implement `/api/tables/query` endpoint
5. Test with frontend login + overview tab

### Phase 2: Links & Inventory
1. Implement Git sync (`/api/git/sync`)
2. Parse `links.yaml` into database
3. Implement `/api/links` endpoints
4. Add enrollment verification logic
5. Test with Links tab

### Phase 3: Operations & Script Execution
1. Parse `scripts.yaml` into database
2. Implement `/api/operations/run`
3. Create SSH execution engine (bash-only)
4. Implement SSE for live output streaming
5. Test with Operations tab

### Phase 4: Terminal & WebSocket
1. Implement `/api/terminal/workspaces`
2. Create WebSocket handler for terminal I/O
3. Implement SSH PTY sessions per pane
4. Test with Terminal tab (4-pane layout)

### Phase 5: Production Readiness
1. Add error handling & logging
2. Implement rate limiting
3. Add audit trail
4. Create systemd service
5. Write deployment scripts

---

## Important Notes

- **No secrets in Git:** Private keys stored in `/var/lib/linkops/keys/`, not in repo
- **Bash-only execution:** No other interpreters allowed
- **Enrollment required:** All operations check client ID before execution
- **Output format:** `[Package #] - [PACKAGE NAME] - [SCRIPT NAME] - [STATUS]`
- **Theme persistence:** Save theme preference in localStorage
- **Session management:** JWT tokens in sessionStorage
- **Auto-refresh:** Overview/Links tabs refresh every 30 seconds

---

## File Structure Summary

```
linkops/
├── frontend/
│   ├── index.html (main app)
│   ├── login.html
│   ├── css/
│   │   ├── main.css
│   │   ├── login.css
│   │   ├── overview.css
│   │   ├── links.css
│   │   ├── operations.css
│   │   └── terminal.css
│   ├── js/
│   │   ├── main.js
│   │   ├── login.js
│   │   ├── overview.js
│   │   ├── links.js
│   │   ├── operations.js
│   │   └── terminal.js
│   └── assets/
│       ├── background/ (3 theme backgrounds)
│       ├── branding/ (LinkOps + SnS logos)
│       └── logos/ (node icons: docker, proxmox, etc.)
│
├── backend/ (TO BE BUILT)
│   ├── main.py / main.go
│   ├── api/
│   ├── ssh/
│   ├── git_sync/
│   └── db/
│
└── BACKEND_INTEGRATION_GUIDE.md (this file)
```

---

**End of Guide**

This document provides everything needed to connect the completed frontend to a backend API. The frontend is production-ready and waiting for backend integration.
