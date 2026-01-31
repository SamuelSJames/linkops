# SSH Config - Fixes and Improvements

## Issues Fixed

### 1. **Missing Newlines** ❌ → ✅
**Before:**
```
Host linodeHostName 172.238.163.85User sam
```

**After:**
```
Host linode
    HostName 172.238.163.85
    User sam
```

### 2. **Typo: "IndentityFile"** ❌ → ✅
**Before:**
```
IndentityFile C:\Users\ssamjame\.ssh\kiro_ide_key
```

**After:**
```
IdentityFile C:\Users\ssamjame\.ssh\kiro_ide_key
```

### 3. **Typo: "krio_ide_key"** ❌ → ✅
**Before:**
```
IdentityFile C:\Users\ssamjame\.ssh\krio_ide_key
```

**After:**
```
IdentityFile C:\Users\ssamjame\.ssh\kiro_ide_key
```
(Assuming you meant "kiro" not "krio")

### 4. **Missing Indentation** ❌ → ✅
SSH config requires proper indentation (4 spaces or 1 tab) for host parameters.

**Before:**
```
Host linodeHostName 172.238.163.85
```

**After:**
```
Host linode
    HostName 172.238.163.85
```

## Improvements Added

### 1. **Connection Keep-Alive**
```
ServerAliveInterval 60
ServerAliveCountMax 3
```
- Sends keep-alive packets every 60 seconds
- Prevents connection timeouts
- Disconnects after 3 failed keep-alives (3 minutes)

### 2. **Compression**
```
Compression yes
```
- Reduces bandwidth usage
- Speeds up transfers over slow connections

### 3. **Connection Multiplexing** (Optional)
```
ControlMaster auto
ControlPath C:\Users\ssamjame\.ssh\sockets\%r@%h-%p
ControlPersist 10m
```
- Reuses existing connections
- Faster subsequent connections
- Connections persist for 10 minutes after last use

**Note:** You need to create the sockets directory:
```bash
mkdir C:\Users\ssamjame\.ssh\sockets
```

### 4. **Security Settings**
```
StrictHostKeyChecking ask
HashKnownHosts yes
```
- Prompts before adding new host keys
- Hashes known_hosts for privacy

### 5. **Comments and Organization**
- Added section headers
- Added comments explaining each host
- Grouped by access method (direct vs jump host)

## Your Infrastructure Map

```
Internet
    │
    ├─── linode (172.238.163.85) ← Jump Host
    │       │
    │       ├─── pre (100.96.17.186)
    │       ├─── mtr (100.96.154.46)
    │       └─── linkops (10.0.1.107) ← LinkOps Backend
    │
    └─── racknerd (172.245.72.108) ← Direct Access
```

## Usage Examples

### Direct Connection
```bash
# Connect to jump host
ssh linode

# Connect to racknerd
ssh racknerd
```

### Through Jump Host
```bash
# Connect to pre (via linode)
ssh pre

# Connect to mtr (via linode)
ssh mtr

# Connect to linkops (via linode)
ssh linkops
```

### Copy Files
```bash
# Copy to linkops through jump host
scp file.txt linkops:/root/

# Copy from linkops
scp linkops:/root/file.txt .

# Copy directory
scp -r directory/ linkops:/root/
```

### Execute Remote Commands
```bash
# Run command on linkops
ssh linkops "systemctl status linkopsd"

# Run multiple commands
ssh linkops "cd /opt/linkops && ls -la"

# Interactive with PTY
ssh -t linkops "sudo nano /etc/linkops/config.ini"
```

### Port Forwarding
```bash
# Forward linkops API to local port 8000
ssh -L 8000:localhost:8000 linkops

# Now access: http://localhost:8000
```

## Testing Your Config

### Test Each Host
```bash
# Test linode (jump host)
ssh -v linode "echo 'Connection successful'"

# Test racknerd
ssh -v racknerd "echo 'Connection successful'"

# Test hosts behind jump
ssh -v pre "echo 'Connection successful'"
ssh -v mtr "echo 'Connection successful'"
ssh -v linkops "echo 'Connection successful'"
```

### Test ProxyJump
```bash
# Verify jump host is being used
ssh -v linkops 2>&1 | grep -i "proxy"
```

### Test Key Authentication
```bash
# Should not prompt for password
ssh linkops "whoami"
```

## Troubleshooting

### Connection Hangs
```bash
# Add verbose output
ssh -vvv linkops

# Check if jump host is reachable
ping 172.238.163.85

# Test jump host connection
ssh linode
```

### Permission Denied
```bash
# Check key permissions (should be 600)
icacls C:\Users\ssamjame\.ssh\kiro_ide_key

# Fix permissions (Windows)
icacls C:\Users\ssamjame\.ssh\kiro_ide_key /inheritance:r
icacls C:\Users\ssamjame\.ssh\kiro_ide_key /grant:r "%USERNAME%:R"
```

### ProxyJump Not Working
```bash
# Test jump host first
ssh linode

# Then test target
ssh -J linode root@10.0.1.107

# If that works, config is correct
```

### Connection Timeout
```bash
# Increase timeout
ssh -o ConnectTimeout=30 linkops

# Or add to config:
# ConnectTimeout 30
```

## Advanced Configuration

### Per-Host Key Files
If you need different keys for different hosts:

```
Host linode
    IdentityFile C:\Users\ssamjame\.ssh\linode_key

Host linkops
    IdentityFile C:\Users\ssamjame\.ssh\linkops_key
```

### Multiple Jump Hosts
If you need to jump through multiple hosts:

```
Host final-destination
    HostName 10.0.2.50
    User root
    ProxyJump linode,mtr
```

### Disable Host Key Checking (Development Only)
```
Host dev-*
    StrictHostKeyChecking no
    UserKnownHostsFile /dev/null
```

⚠️ **Warning:** Only use for development/testing!

## Integration with LinkOps

### Quick Access to LinkOps Container
```bash
# SSH to linkops
ssh linkops

# Check service status
ssh linkops "systemctl status linkopsd"

# View logs
ssh linkops "journalctl -u linkopsd -f"

# Test API
ssh linkops "curl http://localhost:8000/health"
```

### File Transfers
```bash
# Copy backend code to linkops
scp -r backend/ linkops:/opt/linkops/

# Copy config
scp config.ini linkops:/etc/linkops/

# Copy SSH keys
scp ~/.ssh/infrastructure_key linkops:/var/lib/linkops/keys/
```

### Port Forwarding for Development
```bash
# Forward LinkOps API to local machine
ssh -L 8000:localhost:8000 linkops

# Forward Forgejo (if on mtr)
ssh -L 3000:localhost:3000 mtr

# Now access locally:
# http://localhost:8000 - LinkOps API
# http://localhost:3000 - Forgejo
```

## Security Best Practices

### 1. Key Management
- ✅ Use separate keys for different environments
- ✅ Protect private keys (600 permissions)
- ✅ Use passphrase-protected keys
- ✅ Rotate keys periodically (every 6-12 months)

### 2. Connection Security
- ✅ Use StrictHostKeyChecking (enabled in config)
- ✅ Use HashKnownHosts (enabled in config)
- ✅ Keep SSH client updated
- ✅ Use strong key types (ED25519 or RSA 4096)

### 3. Jump Host Security
- ✅ Limit jump host access
- ✅ Monitor jump host logs
- ✅ Use fail2ban on jump host
- ✅ Restrict SSH to key authentication only

## Next Steps

1. **Create sockets directory** (for connection multiplexing):
   ```bash
   mkdir C:\Users\ssamjame\.ssh\sockets
   ```

2. **Test all connections**:
   ```bash
   ssh linode "echo 'Jump host OK'"
   ssh racknerd "echo 'Racknerd OK'"
   ssh pre "echo 'Pre OK'"
   ssh mtr "echo 'MTR OK'"
   ssh linkops "echo 'LinkOps OK'"
   ```

3. **Verify key permissions**:
   ```bash
   icacls C:\Users\ssamjame\.ssh\kiro_ide_key
   ```

4. **Add to known_hosts** (first connection to each host):
   - SSH will prompt to add host key
   - Type "yes" to accept

5. **Test LinkOps access**:
   ```bash
   ssh linkops "curl http://localhost:8000/health"
   ```

## File Location

**Windows:** `C:\Users\ssamjame\.ssh\config`

**To apply changes:**
- No restart needed
- Changes take effect immediately
- Test with: `ssh -G linkops` (shows effective config)

---

**Config Version:** 1.0  
**Last Updated:** January 28, 2026  
**Status:** Optimized and Ready to Use
