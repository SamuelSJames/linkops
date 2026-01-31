# LinkOps Backend - Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying the LinkOps backend API to an Ubuntu 24.04 LXC container.

## Prerequisites

### System Requirements
- Ubuntu 24.04 LTS (LXC container or VM)
- 2 CPU cores (minimum)
- 2GB RAM (minimum)
- 10GB SSD storage
- Network connectivity to target machines
- Internet access for package installation

### Required Access
- Root or sudo access on the Ubuntu container
- SSH access to target machines
- Access to private Git repository containing:
  - `links.yaml` (machine inventory)
  - `scripts.yaml` (script catalog)
  - `secrets.ini` (secrets and configuration)
  - `scripts/` directory (bash scripts)

### Required Files
- SSH private keys for target machines
- Git SSH key for repository access (if using SSH)
- This deployment package

## Installation Steps

### Step 1: Prepare the Ubuntu Container

```bash
# Update system packages
sudo apt update
sudo apt upgrade -y

# Install required system packages
sudo apt install -y \
    python3.11 \
    python3.11-venv \
    python3-pip \
    git \
    openssh-client \
    sqlite3

# Verify Python version
python3.11 --version  # Should be 3.11 or higher
```

### Step 2: Create LinkOps User and Directories

```bash
# Create linkops user (no login shell for security)
sudo useradd -r -s /bin/false -d /var/lib/linkops linkops

# Create directory structure
sudo mkdir -p /etc/linkops
sudo mkdir -p /var/lib/linkops/{keys,ssh,git-repo,logs}
sudo mkdir -p /var/log/linkops

# Set ownership
sudo chown -R linkops:linkops /var/lib/linkops
sudo chown -R linkops:linkops /var/log/linkops
sudo chown root:linkops /etc/linkops
sudo chmod 750 /etc/linkops
```

### Step 3: Install LinkOps Backend

```bash
# Clone or copy the backend code to /opt/linkops
sudo mkdir -p /opt/linkops
sudo cp -r backend/* /opt/linkops/
sudo chown -R linkops:linkops /opt/linkops

# Create Python virtual environment
cd /opt/linkops
sudo -u linkops python3.11 -m venv venv

# Activate virtual environment and install dependencies
sudo -u linkops venv/bin/pip install --upgrade pip
sudo -u linkops venv/bin/pip install -r requirements.txt
```

### Step 4: Configure SSH Keys

```bash
# Copy SSH keys for target machines
sudo cp /path/to/your/ssh/key /var/lib/linkops/keys/sns_prod_ed25519
sudo chown linkops:linkops /var/lib/linkops/keys/sns_prod_ed25519
sudo chmod 600 /var/lib/linkops/keys/sns_prod_ed25519

# Copy Git SSH key (if using SSH for Git)
sudo cp /path/to/git/key /var/lib/linkops/keys/git_deploy_key
sudo chown linkops:linkops /var/lib/linkops/keys/git_deploy_key
sudo chmod 600 /var/lib/linkops/keys/git_deploy_key

# Initialize known_hosts file
sudo touch /var/lib/linkops/ssh/known_hosts
sudo chown linkops:linkops /var/lib/linkops/ssh/known_hosts
sudo chmod 644 /var/lib/linkops/ssh/known_hosts
```

### Step 5: Configure LinkOps

```bash
# Copy configuration template
sudo cp deployment/config.ini.template /etc/linkops/config.ini
sudo chown root:linkops /etc/linkops/config.ini
sudo chmod 640 /etc/linkops/config.ini

# Edit configuration
sudo nano /etc/linkops/config.ini
```

**Required Configuration Changes:**

```ini
[git]
repository_url = git@github.com:your-org/linkops-config.git  # Update this
branch = main

[api]
jwt_secret = <generate-random-secret>  # Generate with: openssl rand -hex 32

[ssh]
keys_directory = /var/lib/linkops/keys
```

### Step 6: Generate JWT Secret

```bash
# Generate a secure JWT secret
JWT_SECRET=$(openssl rand -hex 32)
echo "Generated JWT Secret: $JWT_SECRET"

# Update config.ini with the generated secret
sudo sed -i "s/<generate-random-secret>/$JWT_SECRET/" /etc/linkops/config.ini
```

### Step 7: Initialize Database

```bash
# Run database initialization
sudo -u linkops /opt/linkops/venv/bin/python3 -c "
from backend.db.database import init_database
import asyncio
asyncio.run(init_database())
"

# Verify database was created
sudo -u linkops ls -lh /var/lib/linkops/linkops.db
```

### Step 8: Test Git Repository Access

```bash
# Test Git clone (as linkops user)
sudo -u linkops git clone \
    -c core.sshCommand="ssh -i /var/lib/linkops/keys/git_deploy_key" \
    git@github.com:your-org/linkops-config.git \
    /tmp/test-clone

# If successful, remove test clone
sudo rm -rf /tmp/test-clone
```

### Step 9: Install Systemd Service

```bash
# Copy service file
sudo cp deployment/linkopsd.service /etc/systemd/system/

# Reload systemd
sudo systemctl daemon-reload

# Enable service to start on boot
sudo systemctl enable linkopsd

# Start service
sudo systemctl start linkopsd

# Check status
sudo systemctl status linkopsd
```

### Step 10: Verify Installation

```bash
# Check service is running
sudo systemctl status linkopsd

# Check logs
sudo journalctl -u linkopsd -f

# Test API health endpoint
curl http://localhost:8000/health

# Test authentication endpoint
curl -X POST http://localhost:8000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"admin","password":"admin"}'
```

### Step 11: Initial Git Sync

```bash
# Trigger initial Git sync
curl -X POST http://localhost:8000/api/git/sync \
    -H "Authorization: Bearer <your-jwt-token>"

# Check sync status
curl http://localhost:8000/api/git/status \
    -H "Authorization: Bearer <your-jwt-token>"

# Verify machines were loaded
curl http://localhost:8000/api/links \
    -H "Authorization: Bearer <your-jwt-token>"
```

## Post-Installation Configuration

### Configure Automatic Git Sync

The API will automatically sync the Git repository every 15 minutes (configurable in config.ini). To change the interval:

```ini
[git]
sync_interval_minutes = 15  # Change to desired interval
```

### Configure Admin Password

The default admin password is "admin". To change it:

```bash
# Connect to database
sudo -u linkops sqlite3 /var/lib/linkops/linkops.db

# Update admin password (hash it first in production)
UPDATE users SET password_hash = '<bcrypt-hash>' WHERE username = 'admin';
```

### Configure Log Rotation

```bash
# Create logrotate configuration
sudo tee /etc/logrotate.d/linkops << EOF
/var/log/linkops/api.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 0640 linkops linkops
    sharedscripts
    postrotate
        systemctl reload linkopsd > /dev/null 2>&1 || true
    endscript
}
EOF
```

### Configure Firewall (if applicable)

```bash
# Allow API port (8000)
sudo ufw allow 8000/tcp

# If using reverse proxy, allow proxy port instead
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

## Frontend Integration

### Update Frontend Configuration

Update the frontend JavaScript files to point to the backend API:

```javascript
// In js/main.js or js/config.js
const API_BASE_URL = 'http://your-lxc-ip:8000';
```

### Update CORS Settings (if needed)

If the frontend is hosted on a different domain, update CORS settings in the backend:

```python
# In backend/main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://your-frontend-domain.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Troubleshooting

### Service Won't Start

```bash
# Check logs
sudo journalctl -u linkopsd -n 50

# Check configuration
sudo -u linkops /opt/linkops/venv/bin/python3 -c "
from backend.config import load_config
config = load_config()
print(config)
"

# Check permissions
ls -la /var/lib/linkops/
ls -la /etc/linkops/
```

### Git Sync Fails

```bash
# Test Git access manually
sudo -u linkops git ls-remote \
    -c core.sshCommand="ssh -i /var/lib/linkops/keys/git_deploy_key" \
    git@github.com:your-org/linkops-config.git

# Check Git logs in API logs
sudo journalctl -u linkopsd | grep -i git
```

### SSH Connection Fails

```bash
# Test SSH connection manually
sudo -u linkops ssh -i /var/lib/linkops/keys/sns_prod_ed25519 \
    user@target-machine

# Check SSH key permissions
ls -la /var/lib/linkops/keys/

# Check known_hosts
cat /var/lib/linkops/ssh/known_hosts
```

### Database Issues

```bash
# Check database file
sudo -u linkops sqlite3 /var/lib/linkops/linkops.db ".tables"

# Check database integrity
sudo -u linkops sqlite3 /var/lib/linkops/linkops.db "PRAGMA integrity_check;"

# Backup database
sudo -u linkops cp /var/lib/linkops/linkops.db \
    /var/lib/linkops/linkops.db.backup.$(date +%Y%m%d)
```

## Backup and Recovery

### Backup Procedure

```bash
#!/bin/bash
# backup-linkops.sh

BACKUP_DIR="/var/backups/linkops"
DATE=$(date +%Y%m%d-%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
sudo -u linkops cp /var/lib/linkops/linkops.db \
    $BACKUP_DIR/linkops.db.$DATE

# Backup configuration
sudo cp /etc/linkops/config.ini \
    $BACKUP_DIR/config.ini.$DATE

# Backup SSH keys
sudo tar czf $BACKUP_DIR/keys.$DATE.tar.gz \
    -C /var/lib/linkops keys/

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.db.*" -mtime +7 -delete
find $BACKUP_DIR -name "*.ini.*" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
```

### Recovery Procedure

```bash
# Stop service
sudo systemctl stop linkopsd

# Restore database
sudo -u linkops cp /var/backups/linkops/linkops.db.YYYYMMDD-HHMMSS \
    /var/lib/linkops/linkops.db

# Restore configuration
sudo cp /var/backups/linkops/config.ini.YYYYMMDD-HHMMSS \
    /etc/linkops/config.ini

# Restore SSH keys
sudo tar xzf /var/backups/linkops/keys.YYYYMMDD-HHMMSS.tar.gz \
    -C /var/lib/linkops

# Start service
sudo systemctl start linkopsd
```

## Monitoring

### Check Service Status

```bash
# Service status
sudo systemctl status linkopsd

# Recent logs
sudo journalctl -u linkopsd -n 100

# Follow logs in real-time
sudo journalctl -u linkopsd -f
```

### Monitor Resource Usage

```bash
# CPU and memory usage
ps aux | grep linkops

# Disk usage
du -sh /var/lib/linkops/*

# Database size
ls -lh /var/lib/linkops/linkops.db
```

### Health Checks

```bash
# API health endpoint
curl http://localhost:8000/health

# Git sync status
curl http://localhost:8000/api/git/status \
    -H "Authorization: Bearer <token>"

# Check machine health
curl http://localhost:8000/api/links \
    -H "Authorization: Bearer <token>" | jq '.[] | {name, status, reachable}'
```

## Upgrading

### Upgrade Procedure

```bash
# Backup current installation
./backup-linkops.sh

# Stop service
sudo systemctl stop linkopsd

# Pull new code
cd /opt/linkops
sudo -u linkops git pull

# Update dependencies
sudo -u linkops venv/bin/pip install -r requirements.txt --upgrade

# Run database migrations (if any)
sudo -u linkops venv/bin/python3 -m backend.db.migrations

# Start service
sudo systemctl start linkopsd

# Verify upgrade
sudo journalctl -u linkopsd -n 50
curl http://localhost:8000/health
```

## Uninstallation

```bash
# Stop and disable service
sudo systemctl stop linkopsd
sudo systemctl disable linkopsd

# Remove service file
sudo rm /etc/systemd/system/linkopsd.service
sudo systemctl daemon-reload

# Remove application files
sudo rm -rf /opt/linkops

# Remove data (CAUTION: This deletes all data)
sudo rm -rf /var/lib/linkops
sudo rm -rf /var/log/linkops
sudo rm -rf /etc/linkops

# Remove user
sudo userdel linkops
```

## Security Hardening

### File Permissions

```bash
# Verify critical file permissions
sudo find /var/lib/linkops/keys -type f -exec chmod 600 {} \;
sudo chmod 640 /etc/linkops/config.ini
sudo chmod 750 /var/lib/linkops
```

### Network Security

```bash
# Bind API to localhost only (if using reverse proxy)
# In config.ini:
[api]
host = 127.0.0.1  # Instead of 0.0.0.0
```

### Audit Logging

```bash
# Enable audit logging for linkops user
sudo auditctl -w /var/lib/linkops -p wa -k linkops_data
sudo auditctl -w /etc/linkops -p wa -k linkops_config
```

## Support

For issues or questions:
1. Check logs: `sudo journalctl -u linkopsd -n 100`
2. Review troubleshooting section above
3. Check specification documents in `.kiro/specs/linkops-backend-api/`
4. Contact SnS Network Solutions support

---

**Deployment Guide Version:** 1.0  
**Last Updated:** January 28, 2026  
**Compatible with:** LinkOps Backend API v1.0
