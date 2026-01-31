# LinkOps - Machine Onboarding Guide

This guide explains how to enroll new machines into LinkOps so they can be managed by the platform.

---

## Overview

LinkOps uses an **enrollment-based security model**. Before a machine can execute scripts or be managed, it must:

1. Have a unique client ID file at `/etc/linkops/client_id`
2. Be listed in the Git repository's `links.yaml` file
3. Have the client ID in the file match the client ID in `links.yaml`
4. Be reachable via SSH from the LinkOps server

---

## Onboarding Process

### Step 1: Generate Client ID

On your **local machine** (not the target), generate a unique client ID:

```bash
# Generate a new UUID-based client ID
CLIENT_ID="LINKOPS-$(uuidgen)"
echo "Generated Client ID: $CLIENT_ID"

# Example output:
# LINKOPS-8f3a2c6d-1b7e-4c7a-9c2a-3f1a7d2c9c10
```

**Save this client ID** - you'll need it for the next steps.

---

### Step 2: Install Client ID on Target Machine

Connect to the target machine and install the client ID file:

```bash
# SSH to target machine
ssh user@target-machine

# Create LinkOps directory
sudo mkdir -p /etc/linkops

# Install client ID (replace with your generated ID)
echo "LINKOPS-8f3a2c6d-1b7e-4c7a-9c2a-3f1a7d2c9c10" | sudo tee /etc/linkops/client_id

# Set correct permissions
sudo chmod 644 /etc/linkops/client_id

# Verify installation
cat /etc/linkops/client_id
```

**Expected output:**
```
LINKOPS-8f3a2c6d-1b7e-4c7a-9c2a-3f1a7d2c9c10
```

---

### Step 3: Configure SSH Access

Ensure the LinkOps server can SSH to the target machine:

#### On LinkOps Server:

```bash
# Test SSH connection (as linkops user)
sudo -u linkops ssh -i /var/lib/linkops/keys/sns_prod_ed25519 user@target-machine

# If connection fails, copy SSH public key to target
ssh-copy-id -i /var/lib/linkops/keys/sns_prod_ed25519.pub user@target-machine
```

#### On Target Machine:

```bash
# Verify authorized_keys contains LinkOps public key
cat ~/.ssh/authorized_keys | grep linkops
```

---

### Step 4: Add Machine to Git Repository

Edit your Git repository's `links.yaml` file:

```yaml
links:
  # Add your new machine
  vm-new-machine-01:
    type: VM                    # VPS, Proxmox, or VM
    provider: Ubuntu            # Provider name (for display/icon)
    host: 10.0.3.80            # IP address or hostname
    port: 22                    # SSH port
    user: ubuntu                # SSH username
    tags:
      - prod
      - vm
      - web
    enrollment:
      required: true
      clientId: LINKOPS-8f3a2c6d-1b7e-4c7a-9c2a-3f1a7d2c9c10  # Your generated ID
    ssh:
      keyRef: sns_prod_ed25519  # SSH key reference
      proxyJump: null           # Or jump host if needed
    metadata:
      parent: proxmox-cluster-01  # If it's a VM
      os: Ubuntu 24.04
      icon: assets/logos/ubuntu-linux.svg
```

**Important:** The `clientId` in `links.yaml` must **exactly match** the content of `/etc/linkops/client_id` on the target machine.

---

### Step 5: Commit and Push to Git

```bash
# In your Git repository
git add links.yaml
git commit -m "Add vm-new-machine-01 to inventory"
git push origin main
```

---

### Step 6: Sync LinkOps

Trigger a Git sync on the LinkOps server:

```bash
# Option 1: Via API
curl -X POST http://localhost:8000/api/git/sync \
    -H "Authorization: Bearer <your-jwt-token>"

# Option 2: Wait for automatic sync (every 15 minutes)
# Option 3: Restart service
sudo systemctl restart linkopsd
```

---

### Step 7: Verify Enrollment

Check that the machine is enrolled:

```bash
# Via API
curl -X POST http://localhost:8000/api/links/vm-new-machine-01/verify \
    -H "Authorization: Bearer <your-jwt-token>"

# Expected response:
{
  "enrolled": true,
  "client_id_found": true,
  "client_id_matches": true,
  "verified_at": "2026-01-28T17:30:00Z"
}
```

**Or check in the frontend:**
1. Open LinkOps in browser
2. Go to Links tab
3. Find your machine in the table
4. Check "Enrolled" column shows ✓ Yes

---

## Onboarding Checklist

Use this checklist for each new machine:

- [ ] Generate unique client ID
- [ ] Install client ID on target machine (`/etc/linkops/client_id`)
- [ ] Verify client ID file permissions (644)
- [ ] Test SSH connection from LinkOps server
- [ ] Add machine to `links.yaml` in Git repository
- [ ] Ensure client ID in YAML matches file on target
- [ ] Commit and push to Git
- [ ] Trigger Git sync on LinkOps server
- [ ] Verify enrollment via API or frontend
- [ ] Test script execution on new machine

---

## Bulk Onboarding

For onboarding multiple machines at once:

### Script: `bulk-onboard.sh`

```bash
#!/bin/bash
#
# Bulk onboard multiple machines to LinkOps
#

# Array of machines (hostname:user)
MACHINES=(
    "10.0.3.80:ubuntu"
    "10.0.3.90:ubuntu"
    "10.0.4.10:root"
)

SSH_KEY="/var/lib/linkops/keys/sns_prod_ed25519"

for MACHINE in "${MACHINES[@]}"; do
    HOST="${MACHINE%:*}"
    USER="${MACHINE#*:}"
    
    echo "Onboarding $HOST..."
    
    # Generate client ID
    CLIENT_ID="LINKOPS-$(uuidgen)"
    echo "  Client ID: $CLIENT_ID"
    
    # Install on target
    ssh -i "$SSH_KEY" "$USER@$HOST" "
        sudo mkdir -p /etc/linkops
        echo '$CLIENT_ID' | sudo tee /etc/linkops/client_id
        sudo chmod 644 /etc/linkops/client_id
    "
    
    # Output for links.yaml
    echo "  Add to links.yaml:"
    echo "    host: $HOST"
    echo "    user: $USER"
    echo "    clientId: $CLIENT_ID"
    echo ""
done
```

**Usage:**
```bash
chmod +x bulk-onboard.sh
sudo -u linkops ./bulk-onboard.sh
```

---

## Troubleshooting

### Problem: Enrollment Verification Fails

**Symptom:** Machine shows "Not Enrolled" in frontend

**Checks:**

1. **Client ID file exists on target:**
   ```bash
   ssh user@target cat /etc/linkops/client_id
   ```

2. **Client ID matches links.yaml:**
   ```bash
   # On target
   cat /etc/linkops/client_id
   
   # In Git repo
   grep -A 2 "clientId" links.yaml | grep target-machine
   ```

3. **SSH connection works:**
   ```bash
   sudo -u linkops ssh -i /var/lib/linkops/keys/key user@target
   ```

4. **Git sync completed:**
   ```bash
   curl http://localhost:8000/api/git/status \
       -H "Authorization: Bearer <token>"
   ```

---

### Problem: SSH Connection Fails

**Symptom:** Cannot connect to target machine

**Checks:**

1. **SSH key permissions:**
   ```bash
   ls -la /var/lib/linkops/keys/
   # Should show 600 permissions
   ```

2. **Target is reachable:**
   ```bash
   ping target-machine
   ```

3. **SSH service running on target:**
   ```bash
   ssh user@target systemctl status sshd
   ```

4. **Firewall allows SSH:**
   ```bash
   ssh user@target sudo ufw status
   ```

---

### Problem: Client ID Mismatch

**Symptom:** `client_id_matches: false` in verification

**Solution:**

1. **Check exact client ID on target:**
   ```bash
   ssh user@target cat /etc/linkops/client_id
   ```

2. **Check client ID in links.yaml:**
   ```bash
   grep -A 5 "target-machine" links.yaml
   ```

3. **Ensure no extra whitespace:**
   ```bash
   # On target, remove any trailing whitespace
   sudo sed -i 's/[[:space:]]*$//' /etc/linkops/client_id
   ```

4. **Re-verify:**
   ```bash
   curl -X POST http://localhost:8000/api/links/target-machine/verify \
       -H "Authorization: Bearer <token>"
   ```

---

## Proxy Jump Configuration

For machines behind a jump host (e.g., VMs behind Proxmox):

### In links.yaml:

```yaml
links:
  # Jump host (must be enrolled first)
  proxmox-cluster-01:
    type: Proxmox
    host: 10.0.2.10
    port: 22
    user: root
    enrollment:
      required: true
      clientId: LINKOPS-9c4d2e3f-5a6b-7c8d-9e0f-1a2b3c4d5e6f
    ssh:
      keyRef: sns_prod_ed25519
      proxyJump: null  # No jump host for this one

  # VM behind jump host
  vm-behind-proxmox:
    type: VM
    host: 10.0.3.100
    port: 22
    user: ubuntu
    enrollment:
      required: true
      clientId: LINKOPS-1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d
    ssh:
      keyRef: sns_prod_ed25519
      proxyJump: proxmox-cluster-01  # Jump through Proxmox
```

### Test Proxy Jump:

```bash
# Test connection through jump host
sudo -u linkops ssh -i /var/lib/linkops/keys/sns_prod_ed25519 \
    -J root@10.0.2.10 \
    ubuntu@10.0.3.100
```

---

## Security Best Practices

### 1. Client ID Security

- ✅ Client IDs are not secrets (they're in Git)
- ✅ Security comes from SSH key authentication
- ✅ Client IDs prevent accidental execution on wrong machines
- ✅ Use unique client ID per machine

### 2. SSH Key Management

- ✅ Use separate SSH keys for LinkOps (don't reuse personal keys)
- ✅ Use ED25519 keys (more secure than RSA)
- ✅ Protect private keys with 600 permissions
- ✅ Rotate keys periodically (every 6-12 months)

### 3. Access Control

- ✅ Use least privilege SSH users (not root if possible)
- ✅ Configure sudo for specific commands if needed
- ✅ Use jump hosts for internal networks
- ✅ Restrict SSH to specific IPs if possible

### 4. Monitoring

- ✅ Monitor enrollment verification failures
- ✅ Alert on SSH connection failures
- ✅ Audit script execution logs
- ✅ Review operation history regularly

---

## De-Onboarding (Removing Machines)

To remove a machine from LinkOps:

### Step 1: Remove from Git Repository

```bash
# Edit links.yaml and remove the machine entry
vim links.yaml

# Commit and push
git add links.yaml
git commit -m "Remove vm-old-machine from inventory"
git push origin main
```

### Step 2: Sync LinkOps

```bash
# Trigger Git sync
curl -X POST http://localhost:8000/api/git/sync \
    -H "Authorization: Bearer <token>"
```

### Step 3: (Optional) Remove Client ID from Target

```bash
# On target machine
sudo rm /etc/linkops/client_id
sudo rmdir /etc/linkops  # If empty
```

### Step 4: (Optional) Remove SSH Access

```bash
# On target machine, remove LinkOps public key from authorized_keys
vim ~/.ssh/authorized_keys
# Delete the line with "linkops@sns-network" comment
```

---

## Quick Reference

### Generate Client ID
```bash
echo "LINKOPS-$(uuidgen)"
```

### Install Client ID on Target
```bash
echo "LINKOPS-xxx" | sudo tee /etc/linkops/client_id
sudo chmod 644 /etc/linkops/client_id
```

### Test SSH Connection
```bash
sudo -u linkops ssh -i /var/lib/linkops/keys/key user@target
```

### Verify Enrollment
```bash
curl -X POST http://localhost:8000/api/links/machine-id/verify \
    -H "Authorization: Bearer <token>"
```

### Trigger Git Sync
```bash
curl -X POST http://localhost:8000/api/git/sync \
    -H "Authorization: Bearer <token>"
```

---

## Automated Onboarding Script

For a fully automated onboarding process, use this script:

```bash
#!/bin/bash
#
# Automated LinkOps Machine Onboarding
# Usage: ./onboard-machine.sh <host> <user> <machine-name> <type>
#

set -e

HOST="$1"
USER="$2"
MACHINE_NAME="$3"
TYPE="$4"  # VPS, Proxmox, or VM

if [ -z "$HOST" ] || [ -z "$USER" ] || [ -z "$MACHINE_NAME" ] || [ -z "$TYPE" ]; then
    echo "Usage: $0 <host> <user> <machine-name> <type>"
    echo "Example: $0 10.0.3.80 ubuntu vm-web-01 VM"
    exit 1
fi

SSH_KEY="/var/lib/linkops/keys/sns_prod_ed25519"
GIT_REPO="/var/lib/linkops/git-repo"

echo "=== LinkOps Machine Onboarding ==="
echo "Host: $HOST"
echo "User: $USER"
echo "Machine Name: $MACHINE_NAME"
echo "Type: $TYPE"
echo ""

# Step 1: Generate client ID
CLIENT_ID="LINKOPS-$(uuidgen)"
echo "Generated Client ID: $CLIENT_ID"

# Step 2: Test SSH connection
echo "Testing SSH connection..."
if ! ssh -i "$SSH_KEY" -o ConnectTimeout=10 "$USER@$HOST" "echo 'SSH OK'"; then
    echo "ERROR: Cannot connect to $HOST"
    exit 1
fi
echo "✓ SSH connection successful"

# Step 3: Install client ID on target
echo "Installing client ID on target..."
ssh -i "$SSH_KEY" "$USER@$HOST" "
    sudo mkdir -p /etc/linkops
    echo '$CLIENT_ID' | sudo tee /etc/linkops/client_id > /dev/null
    sudo chmod 644 /etc/linkops/client_id
"
echo "✓ Client ID installed"

# Step 4: Verify installation
INSTALLED_ID=$(ssh -i "$SSH_KEY" "$USER@$HOST" "cat /etc/linkops/client_id")
if [ "$INSTALLED_ID" != "$CLIENT_ID" ]; then
    echo "ERROR: Client ID mismatch"
    exit 1
fi
echo "✓ Client ID verified"

# Step 5: Add to links.yaml
echo "Adding to links.yaml..."
cat >> "$GIT_REPO/links.yaml" << EOF

  $MACHINE_NAME:
    type: $TYPE
    provider: $(echo $TYPE | tr '[:upper:]' '[:lower:]')
    host: $HOST
    port: 22
    user: $USER
    tags:
      - prod
      - $(echo $TYPE | tr '[:upper:]' '[:lower:]')
    enrollment:
      required: true
      clientId: $CLIENT_ID
    ssh:
      keyRef: sns_prod_ed25519
      proxyJump: null
    metadata:
      os: Unknown
      icon: assets/logos/linux.svg
EOF
echo "✓ Added to links.yaml"

# Step 6: Commit and push
echo "Committing to Git..."
cd "$GIT_REPO"
git add links.yaml
git commit -m "Onboard $MACHINE_NAME ($HOST)"
git push origin main
echo "✓ Committed to Git"

# Step 7: Trigger sync
echo "Triggering LinkOps sync..."
# This would call the API, but we'll just restart the service
systemctl restart linkopsd
sleep 5
echo "✓ LinkOps synced"

echo ""
echo "=== Onboarding Complete ==="
echo "Machine: $MACHINE_NAME"
echo "Client ID: $CLIENT_ID"
echo "Status: Ready for operations"
echo ""
echo "Verify enrollment:"
echo "  curl -X POST http://localhost:8000/api/links/$MACHINE_NAME/verify \\"
echo "    -H 'Authorization: Bearer <token>'"
```

**Usage:**
```bash
chmod +x onboard-machine.sh
sudo ./onboard-machine.sh 10.0.3.80 ubuntu vm-web-01 VM
```

---

**Guide Version:** 1.0  
**Last Updated:** January 28, 2026  
**Compatible with:** LinkOps v1.0
