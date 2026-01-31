# SSH Quick Reference - LinkOps Infrastructure

## 🚀 Quick Commands

### Connect to Hosts
```bash
ssh linode      # Jump host (172.238.163.85)
ssh racknerd    # Direct (172.245.72.108)
ssh pre         # Via linode (100.96.17.186)
ssh mtr         # Via linode (100.96.154.46)
ssh linkops     # Via linode (10.0.1.107) ← LinkOps Backend
```

### LinkOps Management
```bash
# Check service
ssh linkops "systemctl status linkopsd"

# View logs
ssh linkops "journalctl -u linkopsd -f"

# Restart service
ssh linkops "systemctl restart linkopsd"

# Test API
ssh linkops "curl http://localhost:8000/health"
```

### File Transfers
```bash
# Copy to linkops
scp file.txt linkops:/root/

# Copy from linkops
scp linkops:/root/file.txt .

# Copy directory
scp -r backend/ linkops:/opt/linkops/
```

### Port Forwarding
```bash
# Access LinkOps API locally
ssh -L 8000:localhost:8000 linkops
# Then open: http://localhost:8000

# Access Forgejo locally
ssh -L 3000:localhost:3000 mtr
# Then open: http://localhost:3000
```

## 🔧 Setup (One-Time)

### 1. Create Sockets Directory
```bash
mkdir C:\Users\ssamjame\.ssh\sockets
```

### 2. Test All Connections
```bash
ssh linode "echo OK"
ssh racknerd "echo OK"
ssh pre "echo OK"
ssh mtr "echo OK"
ssh linkops "echo OK"
```

### 3. Verify Key Permissions
```bash
icacls C:\Users\ssamjame\.ssh\kiro_ide_key
```

## 🐛 Troubleshooting

### Connection Hangs
```bash
ssh -vvv linkops  # Verbose output
```

### Permission Denied
```bash
# Fix key permissions
icacls C:\Users\ssamjame\.ssh\kiro_ide_key /inheritance:r
icacls C:\Users\ssamjame\.ssh\kiro_ide_key /grant:r "%USERNAME%:R"
```

### Test Jump Host
```bash
ssh linode  # Should connect
ssh -J linode root@10.0.1.107  # Manual jump test
```

## 📍 Infrastructure Map

```
Internet
    │
    ├─ linode (172.238.163.85) ← Jump Host
    │     │
    │     ├─ pre (100.96.17.186)
    │     ├─ mtr (100.96.154.46)
    │     └─ linkops (10.0.1.107) ← Backend
    │
    └─ racknerd (172.245.72.108)
```

## 🔑 Key File

**Location:** `C:\Users\ssamjame\.ssh\kiro_ide_key`

**Used for:** All hosts (linode, racknerd, pre, mtr, linkops)

## ⚡ Pro Tips

### Keep Connections Alive
Already configured! Connections stay alive for 10 minutes after last use.

### Reuse Connections
Already configured! Subsequent connections are instant.

### Run Multiple Commands
```bash
ssh linkops "cd /opt/linkops && ls -la && systemctl status linkopsd"
```

### Interactive Commands
```bash
ssh -t linkops "sudo nano /etc/linkops/config.ini"
```

### Background Processes
```bash
ssh linkops "nohup /opt/linkops/script.sh > /tmp/output.log 2>&1 &"
```

---

**Config File:** `C:\Users\ssamjame\.ssh\config`  
**Documentation:** `.ssh/CONFIG_FIXES.md`
