# LinkOps Nginx Proxy Configuration

**Date:** January 29, 2026  
**Issue:** Frontend can't reach backend API  
**Status:** 🔴 NEEDS CONFIGURATION

---

## Current Infrastructure

```
Internet (Cloudflare)
    ↓
Your Host Machine (Nginx Proxy)
    ↓
10.0.1.107 (LinkOps LXC Container)
    ├── Port 3000: Frontend (Python HTTP Server)
    ├── Port 8000: Backend API (FastAPI/Uvicorn)
    └── Port 8080: Frontend (Python HTTP Server - alternate)
```

---

## The Problem

**Current Behavior:**
- User visits: `https://linkops.snsnetlabs.com/onboarding-step1.html`
- Nginx proxies to: `http://10.0.1.107:3000`
- Frontend loads successfully ✅
- Frontend makes API call: `POST /api/onboarding/register`
- Request goes to: `http://10.0.1.107:3000/api/onboarding/register`
- Python HTTP server returns: **501 Not Implemented** ❌
- Backend API never receives the request ❌

**Why It Fails:**
The Python HTTP server on port 3000 only serves static files. It doesn't know about `/api/` routes. Those need to go to the FastAPI backend on port 8000.

---

## The Solution

Configure nginx to route requests based on path:
- `/api/*` → Backend (port 8000)
- Everything else → Frontend (port 3000)

---

## Required Nginx Configuration

### Location: Your Host Machine
**File:** Likely `/etc/nginx/sites-enabled/linkops` or similar

### Configuration:

```nginx
server {
    listen 80;
    server_name linkops.snsnetlabs.com;

    # API requests go to backend (port 8000)
    location /api/ {
        proxy_pass http://10.0.1.107:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket connections for terminal (if needed)
    location /ws/ {
        proxy_pass http://10.0.1.107:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # All other requests go to frontend (port 3000)
    location / {
        proxy_pass http://10.0.1.107:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## How to Find Your Nginx Config

### Option 1: Check common locations
```bash
# On your host machine (not LXC)
ls -la /etc/nginx/sites-enabled/
ls -la /etc/nginx/conf.d/
ls -la /etc/nginx/nginx.conf
```

### Option 2: Search for linkops
```bash
grep -r "linkops.snsnetlabs.com" /etc/nginx/
grep -r "10.0.1.107" /etc/nginx/
grep -r "3000" /etc/nginx/
```

### Option 3: Check nginx process
```bash
ps aux | grep nginx
# Look for config file path in command
```

### Option 4: Check Cloudflare origin
If you're using Cloudflare Tunnel or similar, the configuration might be in:
- Cloudflare dashboard (Zero Trust → Tunnels)
- Local cloudflared config
- Docker container config

---

## After Configuration

### 1. Test nginx config
```bash
sudo nginx -t
```

### 2. Reload nginx
```bash
sudo systemctl reload nginx
# or
sudo nginx -s reload
```

### 3. Test API endpoint
```bash
curl https://linkops.snsnetlabs.com/api/onboarding/register \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","username":"testuser","firstName":"Test","lastName":"User","password":"SecurePass123!"}'
```

Expected response (400 or 422 is OK - means backend is reachable):
```json
{"detail":"This email is already registered. Please login."}
```

### 4. Test frontend
Visit: `https://linkops.snsnetlabs.com/onboarding-step1.html`

Fill out form and submit. Should now work!

---

## Alternative: Use Port 8000 for Everything

If you can't modify nginx config easily, you could configure FastAPI to serve static files:

### Option A: FastAPI Static Files
```python
# In /opt/linkops/backend/main.py
from fastapi.staticfiles import StaticFiles

# Add after app creation
app.mount("/", StaticFiles(directory="/root/linkops", html=True), name="static")
```

Then point nginx to port 8000 for everything.

### Option B: Nginx on LXC
Install nginx on the LXC container itself:
```bash
ssh linkops "apt-get update && apt-get install -y nginx"
```

Configure it to proxy API to 8000 and serve static files from /root/linkops.

---

## Troubleshooting

### Issue: Still getting 501 errors
**Check:** Is nginx actually forwarding to port 8000?
```bash
# On LXC container
ssh linkops "tail -f /var/lib/linkops/logs/api.log"
# or
ssh linkops "journalctl -u linkopsd -f"
```

You should see incoming requests when you submit the form.

### Issue: CORS errors
**Fix:** Add CORS middleware to FastAPI (already done in main.py)

### Issue: 502 Bad Gateway
**Check:** Is backend running?
```bash
ssh linkops "systemctl status linkopsd"
ssh linkops "curl http://localhost:8000/health"
```

---

## Current Status

- ✅ Backend API running on port 8000
- ✅ Frontend running on port 3000
- ❌ Nginx not configured to route /api/ to backend
- ❌ Frontend API calls failing with 501

**Action Required:** Configure nginx proxy on host machine

---

**Document Created:** January 29, 2026  
**Next Step:** Locate and update nginx configuration
