# LinkOps - SSH Orchestration Platform

**LinkOps** is a secure SSH orchestration and bash script execution platform for SnS Network Solutions. It provides a modern web interface for managing infrastructure, executing scripts across multiple machines, and monitoring operations in real-time.

![LinkOps Version](https://img.shields.io/badge/version-1.0.0-blue)
![Python Version](https://img.shields.io/badge/python-3.11+-green)
![License](https://img.shields.io/badge/license-Proprietary-red)

## Features

### 🔐 Secure Authentication
- JWT token-based authentication
- Account lockout protection (5 attempts = 5 min lockout)
- Session management with 24-hour token expiration

### 📊 Infrastructure Overview
- Real-time machine status monitoring
- Health checks with latency tracking
- Infrastructure summary (VPS, Proxmox, VMs)
- Recent activity feed

### 🔗 Machine Management
- Complete machine inventory from Git
- Enrollment-based security model
- Table and topology views
- Search and filtering capabilities

### ⚙️ Script Orchestration
- Execute bash scripts on multiple machines
- Concurrency control for parallel execution
- Real-time output streaming via Server-Sent Events
- Operation history and audit trail

### 💻 Interactive Terminals
- Multi-pane terminal sessions (1, 2, 3, or 4 panes)
- WebSocket-based bidirectional I/O
- SSH PTY sessions per pane
- Multiple layout options

### 🔄 Git-Based Configuration
- Machine inventory in `links.yaml`
- Script catalog in `scripts.yaml`
- Automatic sync every 15 minutes
- Version-controlled infrastructure

### 🛡️ Enrollment Security
- Machines must have `/etc/linkops/client_id` file
- Client ID must match inventory
- Prevents unauthorized script execution

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (Complete)                      │
│  ┌──────────┬──────────┬──────────────┬──────────────────┐  │
│  │ Overview │  Links   │  Operations  │    Terminal      │  │
│  └──────────┴──────────┴──────────────┴──────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ REST / WebSocket
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  Backend API (To Be Built)                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  FastAPI Application                                 │   │
│  │  - Authentication (JWT)                              │   │
│  │  - Git Sync Engine                                   │   │
│  │  - SSH Orchestrator                                  │   │
│  │  - Terminal Manager                                  │   │
│  │  - Table Query Engine                                │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ SSH
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Target Machines                           │
│  ┌──────────┬──────────┬──────────┬──────────┬──────────┐   │
│  │   VPS    │   VPS    │ Proxmox  │   VM     │   VM     │   │
│  └──────────┴──────────┴──────────┴──────────┴──────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Project Structure

```
linkops/
├── assets/                      # Images, logos, backgrounds
│   ├── background/             # Background images
│   ├── branding/               # LinkOps and SnS logos
│   ├── DEMO/                   # Demo screenshots
│   └── logos/                  # Provider and service logos
│
├── backend/                     # Backend API (to be built)
│   └── requirements.txt        # Python dependencies
│
├── css/                         # Stylesheets
│   ├── main.css               # Main application styles
│   ├── login.css              # Login page styles
│   ├── onboarding.css         # Onboarding flow styles
│   ├── overview.css           # Overview tab styles
│   ├── links.css              # Links tab styles
│   ├── operations.css         # Operations tab styles
│   └── terminal.css           # Terminal tab styles
│
├── deployment/                  # Deployment files
│   ├── README.md               # Deployment guide
│   ├── install.sh              # Installation script
│   ├── uninstall.sh            # Uninstallation script
│   ├── linkopsd.service        # Systemd service
│   └── config.ini.template     # Configuration template
│
├── docs/                        # Documentation
│   ├── README.md               # Documentation index
│   ├── PROJECT_STATUS.md       # Current project status
│   ├── IMPLEMENTATION_CHECKLIST.md  # Task tracking
│   ├── build-logs/             # Build and deployment logs
│   ├── guides/                 # User and developer guides
│   └── specs/                  # Technical specifications
│
├── git-repo-example/            # Example Git repository
│   ├── links.yaml              # Machine inventory example
│   ├── scripts.yaml            # Script catalog example
│   ├── secrets.ini             # Secrets template
│   └── README.md               # Git repo documentation
│
├── js/                          # JavaScript modules
│   ├── main.js                 # Main application logic
│   ├── login.js                # Login functionality
│   ├── onboarding-step1.js     # Registration logic
│   ├── onboarding-step2.js     # Git setup logic
│   ├── onboarding-step3.js     # Enrollment logic
│   ├── overview.js             # Overview tab logic
│   ├── links.js                # Links tab logic
│   ├── operations.js           # Operations tab logic
│   └── terminal.js             # Terminal tab logic
│
├── index.html                   # Main application
├── login.html                   # Admin login
├── onboarding-step1.html        # User registration
├── onboarding-step2.html        # Git setup
├── onboarding-step3.html        # First machine enrollment
├── onboarding-success.html      # Onboarding completion
└── README.md                    # This file
```

## Quick Start

### Prerequisites
- Ubuntu 24.04 LXC container
- Python 3.11+
- Git access to private repository
- SSH keys for target machines

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/sns-network/linkops.git
cd linkops

# 2. Run installation script
cd deployment
sudo ./install.sh

# 3. Configure LinkOps
sudo nano /etc/linkops/config.ini
# Update Git repository URL and other settings

# 4. Copy SSH keys
sudo cp /path/to/ssh/key /var/lib/linkops/keys/sns_prod_ed25519
sudo chown linkops:linkops /var/lib/linkops/keys/sns_prod_ed25519
sudo chmod 600 /var/lib/linkops/keys/sns_prod_ed25519

# 5. Start service
sudo systemctl start linkopsd
sudo systemctl status linkopsd

# 6. Test API
curl http://localhost:8000/health
```

### Access Frontend

1. Open `index.html` in a web browser (or serve via web server)
2. Login with default credentials: `admin` / `admin`
3. Navigate through tabs: Overview, Links, Operations, Terminal

## Documentation

### For Users
- **Frontend Guide**: See demo screenshots in `assets/DEMO/`
- **Deployment Guide**: See `deployment/README.md`
- **Git Repository Setup**: See `git-repo-example/README.md`
- **Machine Onboarding**: See `docs/guides/MACHINE_ONBOARDING_GUIDE.md`
- **Demo vs Production**: See `docs/guides/DEMO_AND_PRODUCTION_MODE.md`

### For Developers
- **Complete Specification**: See `docs/specs/PHASE_1_ONBOARDING_SPEC.md`
- **Backend Integration**: See `docs/guides/BACKEND_INTEGRATION_GUIDE.md`
- **AI Implementation**: See `docs/guides/AI_IMPLEMENTATION_GUIDE.md`
- **Implementation Checklist**: See `docs/IMPLEMENTATION_CHECKLIST.md`
- **Project Status**: See `docs/PROJECT_STATUS.md`
- **Build Logs**: See `docs/build-logs/`

## Technology Stack

### Frontend (Complete)
- HTML5, CSS3, JavaScript (ES6+)
- No frameworks (vanilla JS)
- WebSocket for terminal I/O
- Server-Sent Events for operation streaming

### Backend (To Be Built)
- **Framework**: FastAPI 0.104+ (async ASGI)
- **SSH**: asyncssh 2.14+ (async SSH client)
- **Git**: GitPython 3.1+ (Git operations)
- **Database**: SQLite 3 with aiosqlite
- **Auth**: python-jose (JWT tokens)
- **Server**: uvicorn (ASGI server)
- **Testing**: pytest, Hypothesis (property-based testing)

### Deployment
- **OS**: Ubuntu 24.04 LTS
- **Service**: systemd
- **Storage**: 10GB SSD
- **Config**: `/etc/linkops/`
- **Data**: `/var/lib/linkops/`

## Development

### Building the Backend

The backend is fully specified and ready for implementation. Follow the tasks in `.kiro/specs/linkops-backend-api/tasks.md`:

**Phase 1: Project Setup and Authentication** (9 hours)
- Initialize FastAPI project
- Implement database schema
- Implement JWT authentication

**Phase 2: Git Sync and Inventory** (14 hours)
- Implement Git sync engine
- Implement inventory management
- Implement enrollment verification

**Phase 3: SSH Orchestration** (19 hours)
- Implement SSH connection management
- Implement SSH orchestrator
- Implement operations API
- Implement SSE streaming

**Phase 4: Terminal Sessions** (14 hours)
- Implement terminal manager
- Implement WebSocket handler
- Implement terminal API

**Phase 5: Table Queries and Health** (9 hours)
- Implement table query engine
- Implement health monitoring

**Phase 6: Configuration and Deployment** (15 hours)
- Implement configuration management
- Implement error handling
- Implement audit trail
- Create systemd service
- Create deployment scripts

**Phase 7: Testing and Documentation** (18 hours)
- Complete property-based tests (37 properties)
- Complete integration tests
- Create API documentation
- Create deployment documentation

**Total Estimated Effort:** 98 hours (~12-13 working days)

### Testing

The specification includes 37 correctness properties for property-based testing using Hypothesis:

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

### Code Quality

- Line coverage: 85%+
- Branch coverage: 80%+
- Property test coverage: 100% of correctness properties
- All tests must pass before deployment

## Security

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
- Account lockout after 5 failed attempts (5 minutes)
- Secure password hashing (bcrypt)

### Secrets Management
- Secrets stored in `secrets.ini` (synced from Git)
- `secrets.ini` excluded from version control
- Configuration validated on startup

## API Endpoints

### Authentication
- `POST /api/auth/login` - Authenticate and get JWT token

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
- `WS /api/terminal/workspaces/{id}/ws` - WebSocket connection

### Table Queries
- `POST /api/tables/query` - Unified table query

### Git Sync
- `GET /api/git/status` - Get sync status
- `POST /api/git/sync` - Trigger sync

## Configuration

Main configuration file: `/etc/linkops/config.ini`

```ini
[api]
host = 0.0.0.0
port = 8000
jwt_secret = <generated-secret>

[git]
repository_url = git@github.com:your-org/linkops-config.git
branch = main
sync_interval_minutes = 15

[ssh]
keys_directory = /var/lib/linkops/keys
connection_timeout = 30
command_timeout = 300

[security]
max_failed_attempts = 5
lockout_duration_minutes = 5
enrollment_required = true
```

See `deployment/config.ini.template` for all options.

## Monitoring

### Service Status
```bash
sudo systemctl status linkopsd
```

### Logs
```bash
# Follow logs in real-time
sudo journalctl -u linkopsd -f

# View recent logs
sudo journalctl -u linkopsd -n 100
```

### Health Check
```bash
curl http://localhost:8000/health
```

## Troubleshooting

### Service Won't Start
```bash
# Check logs
sudo journalctl -u linkopsd -n 50

# Check configuration
sudo -u linkops /opt/linkops/venv/bin/python3 -c "from backend.config import load_config; print(load_config())"
```

### Git Sync Fails
```bash
# Test Git access
sudo -u linkops git ls-remote git@github.com:your-org/linkops-config.git

# Check logs
sudo journalctl -u linkopsd | grep -i git
```

### SSH Connection Fails
```bash
# Test SSH manually
sudo -u linkops ssh -i /var/lib/linkops/keys/sns_prod_ed25519 user@target

# Check key permissions
ls -la /var/lib/linkops/keys/
```

See `deployment/README.md` for detailed troubleshooting.

## Backup and Recovery

### Backup
```bash
# Backup database
sudo -u linkops cp /var/lib/linkops/linkops.db /var/backups/linkops.db.$(date +%Y%m%d)

# Backup configuration
sudo cp /etc/linkops/config.ini /var/backups/config.ini.$(date +%Y%m%d)

# Backup SSH keys
sudo tar czf /var/backups/linkops-keys.$(date +%Y%m%d).tar.gz -C /var/lib/linkops keys/
```

### Recovery
```bash
# Stop service
sudo systemctl stop linkopsd

# Restore database
sudo -u linkops cp /var/backups/linkops.db.YYYYMMDD /var/lib/linkops/linkops.db

# Restore configuration
sudo cp /var/backups/config.ini.YYYYMMDD /etc/linkops/config.ini

# Start service
sudo systemctl start linkopsd
```

## Contributing

This is a proprietary project for SnS Network Solutions. For internal development:

1. Follow the specification in `.kiro/specs/linkops-backend-api/`
2. Write tests for all new features
3. Ensure all property-based tests pass
4. Update documentation
5. Submit for code review

## License

Proprietary - SnS Network Solutions  
All rights reserved.

## Support

For issues or questions:
- Check documentation in `.kiro/specs/linkops-backend-api/`
- Review troubleshooting guide in `deployment/README.md`
- Contact SnS Network Solutions support

## Roadmap

### Version 1.0 (Current)
- ✅ Complete frontend with 4 tabs
- ✅ Complete specification (requirements, design, tasks)
- ⏳ Backend API implementation
- ⏳ Deployment to Ubuntu LXC

### Version 1.1 (Future)
- Multi-user support with role-based access control
- Advanced script scheduling and cron integration
- Enhanced monitoring with Prometheus integration
- Mobile-responsive frontend
- Dark/light theme toggle

### Version 2.0 (Future)
- Agent-based architecture (optional agent on targets)
- Script marketplace and sharing
- Advanced analytics and reporting
- Integration with external tools (Ansible, Terraform)
- API for third-party integrations

---

**LinkOps Version:** 1.0.0  
**Last Updated:** January 28, 2026  
**Status:** Frontend Complete, Backend Specified, Ready for Implementation

**Built with ❤️ by SnS Network Solutions**
