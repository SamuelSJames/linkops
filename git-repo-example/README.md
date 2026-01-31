# LinkOps Configuration Repository

This is an example Git repository structure for LinkOps configuration management.

## Repository Structure

```
linkops-config/
├── README.md              # This file
├── links.yaml             # Machine inventory
├── scripts.yaml           # Script catalog
├── secrets.ini            # Secrets and credentials (DO NOT COMMIT)
├── .gitignore             # Git ignore file
└── scripts/               # Bash scripts directory
    ├── baseline.sh
    ├── install_nano.sh
    ├── install_vim.sh
    ├── install_docker.sh
    ├── install_nginx.sh
    ├── install_crowdsec.sh
    ├── install_wazuh.sh
    ├── security_audit.sh
    ├── update_system.sh
    ├── install_fail2ban.sh
    ├── backup_config.sh
    ├── install_monitoring.sh
    ├── harden_ssh.sh
    ├── install_firewall.sh
    └── cleanup_system.sh
```

## Files

### links.yaml
Defines all machines (VPS, Proxmox hosts, VMs) that can be managed by LinkOps.

**Required fields per machine:**
- `type`: VPS, Proxmox, or VM
- `provider`: Provider name (for display/icon)
- `host`: IP address or hostname
- `port`: SSH port (usually 22)
- `user`: SSH username
- `enrollment.required`: true/false
- `enrollment.clientId`: LINKOPS-UUID format
- `ssh.keyRef`: SSH key reference name

**Optional fields:**
- `tags`: Array of tags for filtering
- `ssh.proxyJump`: Jump host for nested connections
- `metadata`: Additional metadata (location, OS, icon, etc.)

### scripts.yaml
Defines all available scripts that can be executed on machines.

**Required fields per script:**
- `name`: Display name
- `description`: What the script does
- `path`: Path to script file (relative to repository root)

**Optional fields:**
- `emoji`: Emoji icon for display
- `flags`: Array of available command-line flags
- `estimatedDuration`: Estimated execution time in seconds
- `tags`: Array of tags for categorization

### secrets.ini
Contains sensitive configuration that should NOT be committed to Git.

**Important:** Add `secrets.ini` to `.gitignore`!

This file is synced to `/var/lib/linkops/git-repo/secrets.ini` and parsed by the backend.

### scripts/
Directory containing all bash scripts referenced in `scripts.yaml`.

**Script requirements:**
- Must be bash scripts (#!/bin/bash)
- Must be executable (chmod +x)
- Should handle errors gracefully
- Should provide meaningful exit codes
- Should output progress to stdout

## Setup Instructions

### 1. Create Private Git Repository

```bash
# On GitHub, GitLab, or your Git server
# Create a new private repository named "linkops-config"
```

### 2. Clone and Initialize

```bash
git clone git@github.com:your-org/linkops-config.git
cd linkops-config

# Copy example files
cp /path/to/linkops/git-repo-example/* .

# Create .gitignore
cat > .gitignore << EOF
secrets.ini
*.log
*.tmp
.DS_Store
EOF

# Create scripts directory
mkdir -p scripts
```

### 3. Customize Configuration

Edit `links.yaml` with your actual machines:
- Update IP addresses
- Update SSH users
- Generate enrollment client IDs (UUID format)
- Update SSH key references

Edit `scripts.yaml` with your scripts:
- Add/remove scripts as needed
- Update script paths
- Configure flags

Edit `secrets.ini` with your secrets:
- Add SSH key paths
- Add API keys
- Add service credentials

### 4. Create Scripts

Create bash scripts in the `scripts/` directory:

```bash
# Example: scripts/baseline.sh
cat > scripts/baseline.sh << 'EOF'
#!/bin/bash
set -e

echo "Applying baseline configuration..."

# Update system
apt update
apt upgrade -y

# Install essential packages
apt install -y curl wget git vim htop

# Configure timezone
timedatectl set-timezone UTC

# Configure hostname
hostnamectl set-hostname $(hostname)

echo "Baseline configuration complete"
EOF

chmod +x scripts/baseline.sh
```

### 5. Commit and Push

```bash
git add links.yaml scripts.yaml .gitignore scripts/
git commit -m "Initial LinkOps configuration"
git push origin main
```

**Important:** Do NOT commit `secrets.ini`!

### 6. Configure LinkOps Backend

Update `/etc/linkops/config.ini` on your LinkOps server:

```ini
[git]
repository_url = git@github.com:your-org/linkops-config.git
branch = main
```

### 7. Trigger Initial Sync

```bash
# On LinkOps server
curl -X POST http://localhost:8000/api/git/sync \
    -H "Authorization: Bearer <your-jwt-token>"
```

## Enrollment Client IDs

Each machine must have a client ID file at `/etc/linkops/client_id` that matches the `enrollment.clientId` in `links.yaml`.

### Generate Client IDs

```bash
# Generate a new client ID
uuidgen | awk '{print "LINKOPS-" $0}'
```

### Install Client ID on Target Machine

```bash
# On target machine
sudo mkdir -p /etc/linkops
echo "LINKOPS-8f3a2c6d-1b7e-4c7a-9c2a-3f1a7d2c9c10" | sudo tee /etc/linkops/client_id
sudo chmod 644 /etc/linkops/client_id
```

## SSH Key Management

### Generate SSH Keys

```bash
# Generate ED25519 key (recommended)
ssh-keygen -t ed25519 -f ~/.ssh/linkops_ed25519 -C "linkops@sns-network"

# Copy public key to target machines
ssh-copy-id -i ~/.ssh/linkops_ed25519.pub user@target-machine
```

### Install Keys on LinkOps Server

```bash
# Copy private key to LinkOps server
sudo cp ~/.ssh/linkops_ed25519 /var/lib/linkops/keys/sns_prod_ed25519
sudo chown linkops:linkops /var/lib/linkops/keys/sns_prod_ed25519
sudo chmod 600 /var/lib/linkops/keys/sns_prod_ed25519
```

## Script Development Guidelines

### Script Template

```bash
#!/bin/bash
#
# Script Name: example_script.sh
# Description: What this script does
# Author: Your Name
# Date: YYYY-MM-DD
#

set -e  # Exit on error
set -u  # Exit on undefined variable
set -o pipefail  # Exit on pipe failure

# Parse command-line arguments
DRY_RUN=false
VERBOSE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --verbose)
            VERBOSE=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Main script logic
echo "Starting script execution..."

if [ "$DRY_RUN" = true ]; then
    echo "[DRY RUN] Would execute commands..."
else
    # Actual commands here
    echo "Executing commands..."
fi

echo "Script execution complete"
exit 0
```

### Best Practices

1. **Always use shebang:** `#!/bin/bash`
2. **Use set -e:** Exit on errors
3. **Provide output:** Echo progress messages
4. **Handle flags:** Support --dry-run, --verbose, etc.
5. **Exit codes:** 0 for success, non-zero for failure
6. **Error handling:** Use trap for cleanup
7. **Idempotent:** Safe to run multiple times
8. **Documentation:** Comment complex sections

## Maintenance

### Update Inventory

```bash
# Edit links.yaml
vim links.yaml

# Commit and push
git add links.yaml
git commit -m "Update machine inventory"
git push

# Trigger sync on LinkOps server
curl -X POST http://localhost:8000/api/git/sync \
    -H "Authorization: Bearer <token>"
```

### Add New Script

```bash
# Create script
vim scripts/new_script.sh
chmod +x scripts/new_script.sh

# Add to scripts.yaml
vim scripts.yaml

# Commit and push
git add scripts/new_script.sh scripts.yaml
git commit -m "Add new script"
git push

# Trigger sync
curl -X POST http://localhost:8000/api/git/sync \
    -H "Authorization: Bearer <token>"
```

### Update Secrets

```bash
# Edit secrets.ini (locally, not in Git)
vim secrets.ini

# Copy to Git repository (but don't commit)
cp secrets.ini /path/to/linkops-config/

# Trigger sync to update on server
curl -X POST http://localhost:8000/api/git/sync \
    -H "Authorization: Bearer <token>"
```

## Security Considerations

1. **Never commit secrets.ini to Git**
2. **Use private Git repository**
3. **Restrict repository access**
4. **Use SSH keys for Git authentication**
5. **Rotate SSH keys regularly**
6. **Audit script changes**
7. **Test scripts in staging first**
8. **Use least privilege for SSH users**

## Troubleshooting

### Git Sync Fails

```bash
# Check Git repository access
git ls-remote git@github.com:your-org/linkops-config.git

# Check SSH key permissions
ls -la /var/lib/linkops/keys/

# Check LinkOps logs
sudo journalctl -u linkopsd | grep -i git
```

### Enrollment Verification Fails

```bash
# Check client ID file on target
ssh user@target-machine cat /etc/linkops/client_id

# Compare with links.yaml
grep clientId links.yaml
```

### Script Execution Fails

```bash
# Test script manually
ssh user@target-machine 'bash -s' < scripts/script_name.sh

# Check script permissions
ls -la scripts/

# Check script syntax
bash -n scripts/script_name.sh
```

## Support

For issues or questions, contact SnS Network Solutions support.

---

**Repository Version:** 1.0  
**Last Updated:** January 28, 2026  
**Compatible with:** LinkOps Backend API v1.0
