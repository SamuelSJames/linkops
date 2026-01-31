# LinkOps - Quick Start Guide
**Ready to deploy in 45 minutes!**

---

## Current Status ✅

- Backend code: **COMPLETE** (25 files, ~2000 lines)
- Database: **INITIALIZED** (8 tables)
- Configuration: **READY** (JWT secret generated)
- Dependencies: **INSTALLED** (50+ packages)
- Container: **PREPARED** (2GB RAM, 12GB disk)

---

## Deploy Now (45 minutes)

### Step 1: Forgejo Repository (15 min)

```bash
# Access Forgejo web UI
open http://10.0.1.102:3000

# Create new repository: linkops-config
# Add SSH deploy key from /var/lib/linkops/keys/git_deploy_key.pub

# Clone and setup
git clone git@10.0.1.102:linkops/linkops-config.git
cd linkops-config

# Copy example files from container
scp -r mtr:/root/linkops/git-repo-example/* .

# Edit links.yaml - add your machines
# Edit scripts.yaml - add your scripts

# Commit and push
git add .
git commit -m "Initial configuration"
git push origin main
```

### Step 2: SSH Keys (10 min)

```bash
# Copy SSH key for target machines
scp ~/.ssh/your_infrastructure_key mtr:/tmp/key
ssh mtr "pct push 107 /tmp/key /var/lib/linkops/keys/sns_prod_ed25519"
ssh mtr "pct exec 107 -- chmod 600 /var/lib/linkops/keys/sns_prod_ed25519"
ssh mtr "rm /tmp/key"
```

### Step 3: Update Config (5 min)

```bash
# Edit configuration
ssh mtr "pct exec 107 -- nano /etc/linkops/config.ini"

# Verify this line points to your Forgejo:
# repository_url = git@10.0.1.102:linkops/linkops-config.git
```

### Step 4: Start Service (5 min)

```bash
# Install and start
ssh mtr "pct exec 107 -- bash -c '
cp /root/linkops/deployment/linkopsd.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable linkopsd
systemctl start linkopsd
systemctl status linkopsd
'"
```

### Step 5: Test (10 min)

```bash
# Health check
ssh mtr "pct exec 107 -- curl http://localhost:8000/health"
# Expected: {"status":"healthy","version":"1.0.0"}

# Login
ssh mtr "pct exec 107 -- curl -X POST http://localhost:8000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{\"username\":\"admin\",\"password\":\"admin\"}'"
# Expected: {"token":"eyJ...","expires_in":86400}

# Save token and test
TOKEN="<paste-token-here>"

# Get machines
ssh mtr "pct exec 107 -- curl http://localhost:8000/api/links \
  -H 'Authorization: Bearer $TOKEN'"

# Trigger Git sync
ssh mtr "pct exec 107 -- curl -X POST http://localhost:8000/api/git/sync \
  -H 'Authorization: Bearer $TOKEN'"
```

---

## Access Frontend

```bash
# Frontend is at /root/linkops/frontend/
# Update API URL in frontend/js/config.js or frontend/js/main.js:
# const API_BASE_URL = 'http://10.0.1.107:8000';

# Serve frontend (simple method):
ssh mtr "pct exec 107 -- bash -c 'cd /root/linkops/frontend && python3 -m http.server 8080'"

# Access: http://10.0.1.107:8080
# Login: admin / admin
```

---

## Machine Enrollment

For each target machine:

```bash
# Generate UUID
uuidgen  # Example: 8f3a2c6d-1b7e-4c7a-9c2a-3f1a7d2c9c10

# Add to links.yaml:
# enrollment:
#   required: true
#   clientId: LINKOPS-8f3a2c6d-1b7e-4c7a-9c2a-3f1a7d2c9c10

# On target machine:
ssh target "sudo mkdir -p /etc/linkops"
ssh target "echo 'LINKOPS-8f3a2c6d-1b7e-4c7a-9c2a-3f1a7d2c9c10' | sudo tee /etc/linkops/client_id"
ssh target "sudo chmod 644 /etc/linkops/client_id"

# Verify enrollment via API:
curl -X POST http://10.0.1.107:8000/api/links/<machine-id>/verify \
  -H "Authorization: Bearer $TOKEN"
```

---

## Monitoring

```bash
# Service status
ssh mtr "pct exec 107 -- systemctl status linkopsd"

# Live logs
ssh mtr "pct exec 107 -- journalctl -u linkopsd -f"

# Recent logs
ssh mtr "pct exec 107 -- journalctl -u linkopsd -n 100"

# Database check
ssh mtr "pct exec 107 -- sqlite3 /var/lib/linkops/linkops.db 'SELECT COUNT(*) FROM machines'"
```

---

## Troubleshooting

### Service won't start
```bash
ssh mtr "pct exec 107 -- journalctl -u linkopsd -n 50"
```

### Git sync fails
```bash
# Test Git access
ssh mtr "pct exec 107 -- git ls-remote git@10.0.1.102:linkops/linkops-config.git"
```

### Can't connect to machines
```bash
# Test SSH manually
ssh mtr "pct exec 107 -- ssh -i /var/lib/linkops/keys/sns_prod_ed25519 user@target"
```

---

## API Endpoints

All endpoints require `Authorization: Bearer <token>` header (except /health and /api/auth/login)

- `GET /health` - Health check
- `POST /api/auth/login` - Login
- `GET /api/links` - List machines
- `POST /api/operations/run` - Execute scripts
- `GET /api/operations/{id}` - Get operation status
- `GET /api/operations/{id}/events` - Stream events (SSE)
- `POST /api/git/sync` - Trigger Git sync
- `POST /api/tables/query` - Query tables
- `WS /api/terminal/workspaces/{id}/ws` - Terminal WebSocket

---

## Default Credentials

**Username:** admin  
**Password:** admin

⚠️ Change after first login!

---

## Files Reference

- **Config:** `/etc/linkops/config.ini`
- **Database:** `/var/lib/linkops/linkops.db`
- **SSH Keys:** `/var/lib/linkops/keys/`
- **Git Repo:** `/var/lib/linkops/git-repo/`
- **Logs:** `/var/lib/linkops/logs/api.log`
- **Service:** `/etc/systemd/system/linkopsd.service`

---

## What's Next?

1. ✅ Deploy backend (this guide)
2. Configure frontend API URL
3. Test all features
4. Enroll machines
5. Execute first script
6. Open terminal session
7. Monitor operations

---

**You're ready to go! 🚀**

See `LINKOPS_DEPLOYMENT_STATUS.md` for detailed information.
