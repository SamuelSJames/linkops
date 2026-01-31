#!/bin/bash
#
# LinkOps Backend API - Installation Script
# For Ubuntu 24.04 LXC Container
#
# Usage: sudo ./install.sh
#

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Print functions
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    print_error "This script must be run as root (use sudo)"
    exit 1
fi

print_info "Starting LinkOps Backend API installation..."

# Check Ubuntu version
if ! grep -q "Ubuntu 24.04" /etc/os-release; then
    print_warn "This script is designed for Ubuntu 24.04. Your version may not be compatible."
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Step 1: Update system packages
print_info "Updating system packages..."
apt update
apt upgrade -y

# Step 2: Install required packages
print_info "Installing required packages..."
apt install -y \
    python3.11 \
    python3.11-venv \
    python3-pip \
    git \
    openssh-client \
    sqlite3 \
    curl \
    jq

# Verify Python version
PYTHON_VERSION=$(python3.11 --version | cut -d' ' -f2)
print_info "Python version: $PYTHON_VERSION"

# Step 3: Create linkops user
print_info "Creating linkops user..."
if id "linkops" &>/dev/null; then
    print_warn "User 'linkops' already exists, skipping..."
else
    useradd -r -s /bin/false -d /var/lib/linkops linkops
    print_info "User 'linkops' created"
fi

# Step 4: Create directory structure
print_info "Creating directory structure..."
mkdir -p /etc/linkops
mkdir -p /var/lib/linkops/{keys,ssh,git-repo,logs}
mkdir -p /var/log/linkops
mkdir -p /opt/linkops

# Step 5: Set ownership and permissions
print_info "Setting ownership and permissions..."
chown -R linkops:linkops /var/lib/linkops
chown -R linkops:linkops /var/log/linkops
chown root:linkops /etc/linkops
chmod 750 /etc/linkops
chmod 750 /var/lib/linkops
chmod 700 /var/lib/linkops/keys
chmod 755 /var/lib/linkops/ssh

# Step 6: Copy backend code
print_info "Installing backend code..."
if [ -d "backend" ]; then
    cp -r backend/* /opt/linkops/
    chown -R linkops:linkops /opt/linkops
    print_info "Backend code installed to /opt/linkops"
else
    print_error "Backend directory not found. Please run this script from the deployment directory."
    exit 1
fi

# Step 7: Create Python virtual environment
print_info "Creating Python virtual environment..."
cd /opt/linkops
sudo -u linkops python3.11 -m venv venv

# Step 8: Install Python dependencies
print_info "Installing Python dependencies..."
if [ -f "requirements.txt" ]; then
    sudo -u linkops venv/bin/pip install --upgrade pip
    sudo -u linkops venv/bin/pip install -r requirements.txt
    print_info "Python dependencies installed"
else
    print_error "requirements.txt not found in /opt/linkops"
    exit 1
fi

# Step 9: Copy configuration template
print_info "Installing configuration template..."
if [ -f "deployment/config.ini.template" ]; then
    cp deployment/config.ini.template /etc/linkops/config.ini
    chown root:linkops /etc/linkops/config.ini
    chmod 640 /etc/linkops/config.ini
    print_info "Configuration template installed to /etc/linkops/config.ini"
else
    print_error "config.ini.template not found"
    exit 1
fi

# Step 10: Generate JWT secret
print_info "Generating JWT secret..."
JWT_SECRET=$(openssl rand -hex 32)
sed -i "s/<generate-random-secret>/$JWT_SECRET/" /etc/linkops/config.ini
print_info "JWT secret generated and saved to config.ini"

# Step 11: Initialize known_hosts
print_info "Initializing SSH known_hosts..."
touch /var/lib/linkops/ssh/known_hosts
chown linkops:linkops /var/lib/linkops/ssh/known_hosts
chmod 644 /var/lib/linkops/ssh/known_hosts

# Step 12: Initialize database
print_info "Initializing database..."
sudo -u linkops /opt/linkops/venv/bin/python3 << 'EOF'
import asyncio
import sys
sys.path.insert(0, '/opt/linkops')
from backend.db.database import init_database

async def main():
    await init_database()
    print("Database initialized successfully")

asyncio.run(main())
EOF

if [ -f "/var/lib/linkops/linkops.db" ]; then
    print_info "Database initialized at /var/lib/linkops/linkops.db"
else
    print_error "Database initialization failed"
    exit 1
fi

# Step 13: Install systemd service
print_info "Installing systemd service..."
if [ -f "deployment/linkopsd.service" ]; then
    cp deployment/linkopsd.service /etc/systemd/system/
    systemctl daemon-reload
    systemctl enable linkopsd
    print_info "Systemd service installed and enabled"
else
    print_error "linkopsd.service not found"
    exit 1
fi

# Step 14: Configure log rotation
print_info "Configuring log rotation..."
cat > /etc/logrotate.d/linkops << 'EOF'
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
print_info "Log rotation configured"

# Installation complete
echo
print_info "============================================"
print_info "LinkOps Backend API installation complete!"
print_info "============================================"
echo
print_info "Next steps:"
echo "  1. Edit configuration: sudo nano /etc/linkops/config.ini"
echo "     - Update Git repository URL"
echo "     - Update CORS origins"
echo
echo "  2. Copy SSH keys to /var/lib/linkops/keys/"
echo "     sudo cp /path/to/key /var/lib/linkops/keys/"
echo "     sudo chown linkops:linkops /var/lib/linkops/keys/*"
echo "     sudo chmod 600 /var/lib/linkops/keys/*"
echo
echo "  3. Start the service:"
echo "     sudo systemctl start linkopsd"
echo
echo "  4. Check service status:"
echo "     sudo systemctl status linkopsd"
echo
echo "  5. View logs:"
echo "     sudo journalctl -u linkopsd -f"
echo
echo "  6. Test API:"
echo "     curl http://localhost:8000/health"
echo
print_info "Installation log saved to /var/log/linkops-install.log"
