# LinkOps Backend API - Specification

## Overview

This specification defines the complete backend API for LinkOps, a secure SSH orchestration and bash script execution platform for SnS Network Solutions. The backend integrates with an existing frontend application and provides authentication, inventory management, script execution, real-time monitoring, and interactive terminal sessions.

## Specification Documents

### 1. [Requirements](requirements.md)
Defines **what** the system must do:
- 13 major requirements
- 65 acceptance criteria using EARS patterns
- Complete glossary of system components
- User stories for each feature

### 2. [Design](design.md)
Defines **how** the system will be built:
- High-level architecture with component diagrams
- 6 core components with detailed Python interfaces
- Complete database schema (8 tables)
- All API endpoint specifications
- 37 correctness properties for property-based testing
- Comprehensive error handling strategy
- Testing strategy using Hypothesis library

### 3. [Tasks](tasks.md)
Defines **the order** to build the system:
- 28 implementation tasks organized in 7 phases
- Each task includes acceptance criteria and dependencies
- Estimated effort: 98 hours (~12-13 working days)
- Complete testing and deployment checklists

## Quick Start for AI Implementation

### Prerequisites
- Ubuntu 24.04 LXC container
- Python 3.11+
- Git access to private repository
- SSH keys for target machines

### Implementation Steps

1. **Read the specifications in order:**
   ```
   requirements.md → design.md → tasks.md
   ```

2. **Follow tasks.md phase by phase:**
   - Phase 1: Project Setup and Authentication
   - Phase 2: Git Sync and Inventory Management
   - Phase 3: SSH Orchestration and Operations
   - Phase 4: Terminal Sessions and WebSocket
   - Phase 5: Table Queries and Health Monitoring
   - Phase 6: Configuration and Deployment
   - Phase 7: Testing and Documentation

3. **Validate each task against acceptance criteria**

4. **Run property-based tests to verify correctness**

## Technology Stack

- **Framework**: FastAPI 0.104+ (async ASGI framework)
- **SSH Library**: asyncssh 2.14+ (async SSH client)
- **Git Library**: GitPython 3.1+ (Git operations)
- **Database**: SQLite 3 with aiosqlite (async SQLite driver)
- **Authentication**: python-jose[cryptography] (JWT tokens)
- **Server**: uvicorn (ASGI server)
- **Testing**: pytest, pytest-asyncio, Hypothesis
- **YAML Parser**: PyYAML 6.0+

## Project Structure

```
linkops/
├── frontend/                    # Existing frontend (complete)
│   ├── index.html
│   ├── login.html
│   ├── css/
│   ├── js/
│   └── assets/
│
├── backend/                     # Backend to be built
│   ├── main.py                 # FastAPI application entry point
│   ├── config.py               # Configuration management
│   ├── logging_config.py       # Logging setup
│   ├── requirements.txt        # Python dependencies
│   │
│   ├── api/                    # API endpoints
│   │   ├── auth.py            # Authentication endpoints
│   │   ├── links.py           # Inventory endpoints
│   │   ├── operations.py      # Operations endpoints
│   │   ├── terminal.py        # Terminal endpoints
│   │   ├── tables.py          # Table query endpoints
│   │   ├── git.py             # Git sync endpoints
│   │   └── sse.py             # Server-Sent Events
│   │
│   ├── services/               # Business logic
│   │   ├── auth_service.py
│   │   ├── git_sync_engine.py
│   │   ├── enrollment_verifier.py
│   │   ├── ssh_orchestrator.py
│   │   ├── terminal_manager.py
│   │   ├── table_query_engine.py
│   │   ├── health_monitor.py
│   │   └── ssh_manager.py
│   │
│   ├── db/                     # Database layer
│   │   ├── schema.sql
│   │   ├── database.py
│   │   ├── models.py
│   │   └── migrations.py
│   │
│   ├── middleware/             # Middleware
│   │   ├── auth_middleware.py
│   │   └── error_handler.py
│   │
│   └── parsers/                # YAML parsers
│       └── yaml_parser.py
│
├── tests/                       # Test suite
│   ├── unit/                   # Unit tests
│   ├── property/               # Property-based tests
│   └── integration/            # Integration tests
│
├── deployment/                  # Deployment files
│   ├── linkopsd.service        # Systemd service
│   ├── install.sh              # Installation script
│   ├── uninstall.sh            # Uninstallation script
│   └── config.ini.template     # Configuration template
│
├── docs/                        # Documentation
│   ├── API.md
│   ├── AUTHENTICATION.md
│   ├── WEBSOCKET.md
│   ├── DEPLOYMENT.md
│   ├── CONFIGURATION.md
│   ├── TROUBLESHOOTING.md
│   └── OPERATIONS.md
│
└── .kiro/specs/linkops-backend-api/  # This specification
    ├── README.md               # This file
    ├── requirements.md         # Requirements specification
    ├── design.md               # Design specification
    └── tasks.md                # Implementation tasks
```

## Key Features

### 1. Authentication
- JWT token-based authentication
- 24-hour token expiration
- Account lockout after 5 failed attempts (5-minute duration)

### 2. Git Synchronization
- Automatic sync from private Git repository
- Parses links.yaml (machine inventory)
- Parses scripts.yaml (script catalog)
- Periodic sync every 15 minutes

### 3. Enrollment Verification
- Validates machines have `/etc/linkops/client_id` file
- Compares client ID with inventory
- Only enrolled machines can execute operations

### 4. SSH Orchestration
- Execute bash scripts on multiple machines
- Concurrency control (configurable parallel executions)
- Real-time output capture
- Exit code and duration tracking

### 5. Real-Time Monitoring
- Server-Sent Events (SSE) for operation streaming
- Live script output and status updates
- Automatic stream closure on completion

### 6. Interactive Terminals
- Multi-pane terminal workspaces (1, 2, 3, or 4 panes)
- WebSocket-based bidirectional I/O
- SSH PTY sessions per pane
- Support for layouts: single, grid2x2, grid1x3, grid2x1

### 7. Table-Based Queries
- Unified query endpoint for all data tables
- Excel-like interface with filtering, sorting, pagination
- Supported tables: tbl_links, tbl_operations_history, tbl_recent_activity, etc.

### 8. Health Monitoring
- Periodic SSH connectivity checks
- Latency measurement
- Status tracking (online/offline)
- Last seen timestamps

## API Endpoints Summary

### Authentication
- `POST /api/auth/login` - Authenticate and get JWT token

### Inventory
- `GET /api/links` - Get all machines
- `GET /api/links/{id}` - Get specific machine
- `POST /api/links/{id}/verify` - Verify enrollment

### Operations
- `POST /api/operations/run` - Execute scripts
- `GET /api/operations/{id}` - Get operation status
- `GET /api/operations/{id}/events` - Stream operation events (SSE)
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

## Testing Strategy

### Unit Tests
- Test individual components in isolation
- Mock external dependencies (SSH, Git, file system)
- Focus on edge cases and error conditions

### Property-Based Tests
- Test universal properties that hold for all inputs
- Use Hypothesis library for randomized testing
- Minimum 100 iterations per property
- All 37 correctness properties must be tested

### Integration Tests
- Test complete API workflows
- Test WebSocket and SSE connections
- Test authentication middleware
- Test error responses

### Coverage Goals
- Line coverage: 85%+
- Branch coverage: 80%+
- Property test coverage: 100% of correctness properties
- Integration test coverage: All API endpoints

## Deployment

### Target Environment
- Ubuntu 24.04 LXC container
- 10GB SSD storage
- Systemd service management

### File System Layout
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

### Installation
```bash
# Run installation script
sudo ./deployment/install.sh

# Configure Git repository
sudo nano /etc/linkops/config.ini

# Copy SSH keys
sudo cp ~/.ssh/id_ed25519 /var/lib/linkops/keys/
sudo chmod 600 /var/lib/linkops/keys/id_ed25519

# Start service
sudo systemctl start linkopsd
sudo systemctl enable linkopsd

# Check status
sudo systemctl status linkopsd
```

## Security Considerations

### Enrollment-Based Security
- All operations require target machines to be enrolled
- Enrollment verified by comparing client ID files
- Prevents unauthorized script execution

### SSH Key Management
- Private keys stored in `/var/lib/linkops/keys/`
- Keys must have 600 permissions
- Keys never stored in Git repository

### Authentication
- JWT tokens with 24-hour expiration
- Account lockout after 5 failed attempts
- Secure password hashing (implementation detail)

### Secrets Management
- Secrets stored in secrets.ini (synced from Git)
- secrets.ini excluded from version control
- Configuration validated on startup

## Frontend Integration

The backend integrates with an existing frontend application. Key integration points:

### JavaScript Files to Update
- `js/login.js` - Replace demo auth with `/api/auth/login`
- `js/overview.js` - Replace demo data with `/api/tables/query`
- `js/links.js` - Replace demo data with `/api/links`
- `js/operations.js` - Replace demo execution with `/api/operations/run` and SSE
- `js/terminal.js` - Replace simulated SSH with WebSocket

### API Response Formats
All API responses match the formats expected by the frontend. See `BACKEND_INTEGRATION_GUIDE.md` for detailed integration instructions.

## Correctness Properties

The design document defines 37 correctness properties that must hold for all valid executions. These properties serve as formal specifications for property-based testing:

**Examples:**
- Property 1: For any valid credentials, authenticating should return a JWT token that expires exactly 24 hours from issuance
- Property 11: For any machine with a client ID file, enrollment verification should mark the machine as enrolled if and only if the file contents match the inventory client ID
- Property 18: For any operation with concurrency N, at most N script executions should run in parallel at any given time

See `design.md` for the complete list of properties.

## Development Workflow

### For AI Implementation

1. **Start with Phase 1 (Authentication)**
   - Read Task 1.1, 1.2, 1.3 in tasks.md
   - Implement each task following acceptance criteria
   - Write unit tests and property tests
   - Verify all acceptance criteria are met

2. **Continue through phases sequentially**
   - Each phase builds on previous phases
   - Dependencies are clearly marked
   - Don't skip phases

3. **Validate continuously**
   - Run tests after each task
   - Check acceptance criteria
   - Verify property tests pass

4. **Complete documentation**
   - Update API documentation as endpoints are built
   - Document configuration options
   - Create deployment guides

### For Human Review

1. **Review requirements** - Ensure all features are needed
2. **Review design** - Validate architectural decisions
3. **Review tasks** - Confirm implementation order
4. **Test incrementally** - Test each phase as it's completed
5. **Deploy to staging** - Test in Ubuntu LXC before production

## Success Criteria

The implementation is complete when:

- ✅ All 65 acceptance criteria are met
- ✅ All 37 property-based tests pass (100 iterations each)
- ✅ All integration tests pass
- ✅ Code coverage meets goals (85% line, 80% branch)
- ✅ API documentation is complete
- ✅ Deployment documentation is complete
- ✅ Service runs successfully in Ubuntu LXC
- ✅ Frontend integrates successfully with backend
- ✅ All security requirements are met

## Support and Troubleshooting

### Common Issues

**SSH Connection Failures:**
- Check SSH key permissions (must be 600)
- Verify target machine is reachable
- Check enrollment status

**Git Sync Failures:**
- Verify Git repository URL is correct
- Check SSH key for Git authentication
- Verify network connectivity

**Operation Failures:**
- Check target machines are enrolled
- Verify scripts exist in repository
- Check script syntax (must be bash)

**WebSocket Connection Issues:**
- Verify JWT token is valid
- Check workspace exists
- Verify target machine is enrolled

See `docs/TROUBLESHOOTING.md` (to be created) for detailed troubleshooting guides.

## License

Proprietary - SnS Network Solutions

## Contact

For questions about this specification, contact the SnS Network Solutions development team.

---

**Specification Version:** 1.0  
**Last Updated:** January 28, 2026  
**Status:** Complete - Ready for Implementation
