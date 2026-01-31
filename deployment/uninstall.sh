#!/bin/bash
#
# LinkOps Backend API - Uninstallation Script
# For Ubuntu 24.04 LXC Container
#
# Usage: sudo ./uninstall.sh
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

print_warn "============================================"
print_warn "LinkOps Backend API Uninstallation"
print_warn "============================================"
echo
print_warn "This will remove:"
echo "  - LinkOps service"
echo "  - Application files (/opt/linkops)"
echo "  - Data directory (/var/lib/linkops)"
echo "  - Configuration (/etc/linkops)"
echo "  - Logs (/var/log/linkops)"
echo "  - linkops user"
echo
print_error "ALL DATA WILL BE PERMANENTLY DELETED!"
echo
read -p "Are you sure you want to continue? (type 'yes' to confirm): " -r
echo

if [ "$REPLY" != "yes" ]; then
    print_info "Uninstallation cancelled"
    exit 0
fi

# Offer backup option
echo
read -p "Do you want to backup data before uninstalling? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    BACKUP_DIR="/tmp/linkops-backup-$(date +%Y%m%d-%H%M%S)"
    print_info "Creating backup at $BACKUP_DIR..."
    mkdir -p "$BACKUP_DIR"
    
    # Backup database
    if [ -f "/var/lib/linkops/linkops.db" ]; then
        cp /var/lib/linkops/linkops.db "$BACKUP_DIR/"
        print_info "Database backed up"
    fi
    
    # Backup configuration
    if [ -f "/etc/linkops/config.ini" ]; then
        cp /etc/linkops/config.ini "$BACKUP_DIR/"
        print_info "Configuration backed up"
    fi
    
    # Backup SSH keys
    if [ -d "/var/lib/linkops/keys" ]; then
        tar czf "$BACKUP_DIR/keys.tar.gz" -C /var/lib/linkops keys/
        print_info "SSH keys backed up"
    fi
    
    print_info "Backup completed at $BACKUP_DIR"
    echo
fi

# Step 1: Stop and disable service
print_info "Stopping and disabling linkopsd service..."
if systemctl is-active --quiet linkopsd; then
    systemctl stop linkopsd
    print_info "Service stopped"
fi

if systemctl is-enabled --quiet linkopsd; then
    systemctl disable linkopsd
    print_info "Service disabled"
fi

# Step 2: Remove systemd service file
print_info "Removing systemd service file..."
if [ -f "/etc/systemd/system/linkopsd.service" ]; then
    rm /etc/systemd/system/linkopsd.service
    systemctl daemon-reload
    print_info "Service file removed"
fi

# Step 3: Remove application files
print_info "Removing application files..."
if [ -d "/opt/linkops" ]; then
    rm -rf /opt/linkops
    print_info "Application files removed from /opt/linkops"
fi

# Step 4: Remove data directory
print_info "Removing data directory..."
if [ -d "/var/lib/linkops" ]; then
    rm -rf /var/lib/linkops
    print_info "Data directory removed from /var/lib/linkops"
fi

# Step 5: Remove configuration
print_info "Removing configuration..."
if [ -d "/etc/linkops" ]; then
    rm -rf /etc/linkops
    print_info "Configuration removed from /etc/linkops"
fi

# Step 6: Remove logs
print_info "Removing logs..."
if [ -d "/var/log/linkops" ]; then
    rm -rf /var/log/linkops
    print_info "Logs removed from /var/log/linkops"
fi

# Step 7: Remove log rotation configuration
print_info "Removing log rotation configuration..."
if [ -f "/etc/logrotate.d/linkops" ]; then
    rm /etc/logrotate.d/linkops
    print_info "Log rotation configuration removed"
fi

# Step 8: Remove linkops user
print_info "Removing linkops user..."
if id "linkops" &>/dev/null; then
    userdel linkops
    print_info "User 'linkops' removed"
fi

# Uninstallation complete
echo
print_info "============================================"
print_info "LinkOps Backend API uninstallation complete!"
print_info "============================================"
echo

if [ -n "$BACKUP_DIR" ]; then
    print_info "Your backup is available at: $BACKUP_DIR"
    echo
fi

print_info "The following packages were NOT removed (may be used by other applications):"
echo "  - python3.11"
echo "  - git"
echo "  - openssh-client"
echo "  - sqlite3"
echo
print_info "To remove these packages manually, run:"
echo "  sudo apt remove python3.11 python3.11-venv git openssh-client sqlite3"
echo "  sudo apt autoremove"
