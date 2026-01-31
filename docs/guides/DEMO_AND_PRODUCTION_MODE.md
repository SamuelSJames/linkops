# LinkOps - Demo and Production Mode Guide

This guide explains how to run LinkOps with both demo data (for testing/development) and real production data simultaneously.

---

## Overview

LinkOps can operate in three modes:

1. **Demo Mode Only** - Uses hardcoded demo data (current frontend state)
2. **Production Mode Only** - Uses real backend API with real machines
3. **Hybrid Mode** - Demo data + Real data side-by-side (recommended for testing)

---

## Architecture Options

### Option 1: Separate Instances (Recommended)

Run two separate LinkOps instances:

```
┌─────────────────────────────────────────┐
│  Demo Instance (Windows/Local)          │
│  - Frontend with demo data              │
│  - No backend required                  │
│  - Port: 8080 (or file://)              │
│  - Use: Testing, demos, development     │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Production Instance (Ubuntu LXC)       │
│  - Frontend + Backend API               │
│  - Real machines, real operations       │
│  - Port: 8000 (backend), 80 (frontend)  │
│  - Use: Production operations           │
└─────────────────────────────────────────┘
```

**Advantages:**
- ✅ Clean separation of concerns
- ✅ Demo never affects production
- ✅ Easy to show demos without production access
- ✅ Can test frontend changes without backend

**Setup:**
```bash
# Demo (current setup on Windows)
# Just open index.html in browser - already working!

# Production (Ubuntu LXC)
# Deploy backend + frontend
cd deployment
sudo ./install.sh
```

---

### Option 2: Single Instance with Mode Toggle

Add a mode toggle to the frontend that switches between demo and real data:

```
┌─────────────────────────────────────────┐
│  LinkOps (Ubuntu LXC)                   │
│  ┌───────────────────────────────────┐  │
│  │  Frontend                         │  │
│  │  [Demo Mode] [Production Mode]   │  │
│  │                                   │  │
│  │  Demo Mode:                       │  │
│  │  - Uses DEMO_MACHINES array      │  │
│  │  - Simulated operations           │  │
│  │                                   │  │
│  │  Production Mode:                 │  │
│  │  - Calls backend API              │  │
│  │  - Real operations                │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │  Backend API                      │  │
│  │  - Real machines                  │  │
│  │  - Real operations                │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

**Advantages:**
- ✅ Single deployment
- ✅ Easy to switch between modes
- ✅ Can compare demo vs real behavior
- ✅ Good for training users

**Implementation:**
See "Implementation: Mode Toggle" section below.

---

### Option 3: Hybrid Data (Demo + Real)

Show both demo machines and real machines in the same view:

```
Links Tab:
┌─────────────────────────────────────────┐
│  [All] [Demo] [Production]              │
├─────────────────────────────────────────┤
│  📦 DEMO: vps-linode-01 (Demo)          │
│  📦 DEMO: vps-racknerd-01 (Demo)        │
│  ─────────────────────────────────────  │
│  🟢 PROD: prod-web-01 (Real)            │
│  🟢 PROD: prod-db-01 (Real)             │
│  🟢 PROD: prod-docker-01 (Real)         │
└─────────────────────────────────────────┘
```

**Advantages:**
- ✅ See demo and real data together
- ✅ Easy to compare
- ✅ Good for migration period

**Implementation:**
See "Implementation: Hybrid Data" section below.

---

## Implementation: Mode Toggle

### Step 1: Add Mode Toggle to Frontend

Update `index.html` to add a mode selector:

```html
<!-- In top-bar-right, before theme-selector -->
<div class="mode-selector">
    <button class="mode-btn active" data-mode="demo" title="Demo Mode">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 2L3 7h10L8 2z" fill="currentColor"/>
            <rect x="4" y="7" width="8" height="7" fill="currentColor" opacity="0.5"/>
        </svg>
        <span>Demo</span>
    </button>
    <button class="mode-btn" data-mode="production" title="Production Mode">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="2" fill="none"/>
            <circle cx="8" cy="8" r="2" fill="currentColor"/>
        </svg>
        <span>Production</span>
    </button>
</div>
```

### Step 2: Add Mode Toggle Styles

Update `css/main.css`:

```css
/* Mode Selector */
.mode-selector {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    padding: 4px;
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    margin-right: var(--spacing-md);
}

.mode-btn {
    padding: 6px 12px;
    background: transparent;
    border: 2px solid transparent;
    border-radius: 6px;
    color: var(--text-secondary);
    font-size: 13px;
    font-family: var(--font-primary);
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 6px;
    transition: all 0.2s ease;
}

.mode-btn:hover {
    border-color: var(--border-hover);
    color: var(--text-primary);
    background: var(--bg-hover);
}

.mode-btn.active {
    border-color: var(--accent-primary);
    color: var(--accent-primary);
    background: var(--bg-active);
    box-shadow: 0 0 12px rgba(122, 159, 216, 0.3);
}

.mode-btn svg {
    width: 16px;
    height: 16px;
}
```

### Step 3: Update JavaScript to Support Modes

Update `js/main.js`:

```javascript
// Global mode state
let currentMode = 'demo'; // 'demo' or 'production'

// Mode toggle handler
document.addEventListener('DOMContentLoaded', () => {
    // Load saved mode from localStorage
    currentMode = localStorage.getItem('linkops_mode') || 'demo';
    updateModeUI();
    
    // Mode toggle buttons
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            currentMode = btn.dataset.mode;
            localStorage.setItem('linkops_mode', currentMode);
            updateModeUI();
            refreshAllData();
        });
    });
});

function updateModeUI() {
    document.querySelectorAll('.mode-btn').forEach(btn => {
        if (btn.dataset.mode === currentMode) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

function refreshAllData() {
    // Refresh all tabs based on current mode
    if (document.getElementById('overview-tab').classList.contains('active')) {
        renderHealthTable();
    }
    if (document.getElementById('links-tab').classList.contains('active')) {
        renderLinksTable();
    }
    // ... refresh other tabs
}
```

### Step 4: Update Data Fetching Functions

Update `js/overview.js`:

```javascript
// Fetch machines based on current mode
async function fetchMachines() {
    if (currentMode === 'demo') {
        // Return demo data
        return DEMO_MACHINES;
    } else {
        // Fetch from API
        try {
            const token = sessionStorage.getItem('jwt_token');
            const response = await fetch('http://localhost:8000/api/links', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch machines');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error fetching machines:', error);
            // Fallback to demo data on error
            return DEMO_MACHINES;
        }
    }
}

// Update renderHealthTable to use fetchMachines
async function renderHealthTable() {
    const tbody = document.getElementById('healthTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">Loading...</td></tr>';
    
    const machines = await fetchMachines();
    
    tbody.innerHTML = '';
    machines.forEach(machine => {
        const row = createHealthTableRow(machine);
        tbody.appendChild(row);
    });
}
```

### Step 5: Add Mode Indicator to Data

Add visual indicators to show which data is demo vs real:

```javascript
function createHealthTableRow(machine) {
    const tr = document.createElement('tr');
    
    // Add mode indicator class
    if (currentMode === 'demo') {
        tr.classList.add('demo-row');
    } else {
        tr.classList.add('production-row');
    }
    
    // ... rest of row creation
    
    // Add mode badge to machine name
    const nameTd = document.createElement('td');
    nameTd.className = 'col-name';
    const nameDiv = document.createElement('div');
    nameDiv.className = 'machine-name';
    
    // Mode badge
    if (currentMode === 'demo') {
        const badge = document.createElement('span');
        badge.className = 'mode-badge demo-badge';
        badge.textContent = 'DEMO';
        nameDiv.appendChild(badge);
    }
    
    // ... rest of name cell
}
```

### Step 6: Add Mode Badge Styles

Update `css/overview.css`:

```css
/* Mode badges */
.mode-badge {
    display: inline-block;
    padding: 2px 6px;
    font-size: 10px;
    font-weight: 600;
    border-radius: 4px;
    margin-right: 8px;
    text-transform: uppercase;
}

.demo-badge {
    background: rgba(251, 191, 36, 0.15);
    color: #fbbf24;
    border: 1px solid rgba(251, 191, 36, 0.3);
}

.production-badge {
    background: rgba(74, 222, 128, 0.15);
    color: #4ade80;
    border: 1px solid rgba(74, 222, 128, 0.3);
}

/* Row styling */
.demo-row {
    background: rgba(251, 191, 36, 0.02);
}

.production-row {
    background: rgba(74, 222, 128, 0.02);
}
```

---

## Implementation: Hybrid Data

To show both demo and real data simultaneously:

### Step 1: Merge Data Sources

```javascript
async function fetchAllMachines() {
    const demoMachines = DEMO_MACHINES.map(m => ({
        ...m,
        source: 'demo',
        id: `demo-${m.id}`
    }));
    
    let productionMachines = [];
    try {
        const token = sessionStorage.getItem('jwt_token');
        const response = await fetch('http://localhost:8000/api/links', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            productionMachines = (await response.json()).map(m => ({
                ...m,
                source: 'production',
                id: `prod-${m.id}`
            }));
        }
    } catch (error) {
        console.error('Error fetching production machines:', error);
    }
    
    return [...demoMachines, ...productionMachines];
}
```

### Step 2: Add Filter Buttons

```html
<div class="data-filter">
    <button class="filter-btn active" data-filter="all">All</button>
    <button class="filter-btn" data-filter="demo">Demo Only</button>
    <button class="filter-btn" data-filter="production">Production Only</button>
</div>
```

### Step 3: Filter Display

```javascript
let currentFilter = 'all'; // 'all', 'demo', or 'production'

function renderHealthTable() {
    const machines = await fetchAllMachines();
    
    const filteredMachines = machines.filter(m => {
        if (currentFilter === 'all') return true;
        return m.source === currentFilter;
    });
    
    // Render filtered machines
    filteredMachines.forEach(machine => {
        const row = createHealthTableRow(machine);
        tbody.appendChild(row);
    });
}
```

---

## Configuration File Approach

For more advanced control, use a configuration file:

### Create `config.js`:

```javascript
// LinkOps Configuration
const LINKOPS_CONFIG = {
    // Mode: 'demo', 'production', or 'hybrid'
    mode: 'demo',
    
    // API endpoint (for production mode)
    apiBaseUrl: 'http://localhost:8000',
    
    // Demo data settings
    demo: {
        enabled: true,
        showBadges: true,
        machineCount: 10
    },
    
    // Production data settings
    production: {
        enabled: false,
        autoRefresh: true,
        refreshInterval: 30000 // 30 seconds
    },
    
    // Hybrid mode settings
    hybrid: {
        showDemoData: true,
        showProductionData: true,
        separateSections: true
    }
};
```

### Load in `index.html`:

```html
<script src="js/config.js"></script>
<script src="js/main.js"></script>
```

### Use in JavaScript:

```javascript
async function fetchMachines() {
    let machines = [];
    
    if (LINKOPS_CONFIG.mode === 'demo' || 
        (LINKOPS_CONFIG.mode === 'hybrid' && LINKOPS_CONFIG.hybrid.showDemoData)) {
        machines = [...machines, ...DEMO_MACHINES.map(m => ({...m, source: 'demo'}))];
    }
    
    if (LINKOPS_CONFIG.mode === 'production' || 
        (LINKOPS_CONFIG.mode === 'hybrid' && LINKOPS_CONFIG.hybrid.showProductionData)) {
        const prodMachines = await fetchProductionMachines();
        machines = [...machines, ...prodMachines.map(m => ({...m, source: 'production'}))];
    }
    
    return machines;
}
```

---

## Recommended Setup for Your Use Case

Based on your question, I recommend **Option 1: Separate Instances**:

### On Windows (Current Setup) - Demo Mode
```
Purpose: Testing, demos, development
Location: C:\Users\ssamjame\Documents\Kiro\linkops\
Status: Already working!
Access: Open index.html in browser
Data: Demo data (10 machines, simulated operations)
```

**Keep this as-is** - it's perfect for:
- Testing frontend changes
- Showing demos to stakeholders
- Training users
- Development without affecting production

### On Ubuntu LXC - Production Mode
```
Purpose: Real operations on real machines
Location: /opt/linkops/ (after deployment)
Status: To be deployed
Access: http://lxc-ip:8000 (backend), http://lxc-ip:80 (frontend)
Data: Real machines from Git repository
```

**Deploy this for production** - it will:
- Connect to real machines
- Execute real scripts
- Store real operation history
- Provide real-time monitoring

### Migration Path

1. **Phase 1: Demo Only (Current)**
   - ✅ Frontend working with demo data
   - ✅ No backend needed
   - ✅ Safe to test and develop

2. **Phase 2: Deploy Production Backend**
   - Deploy backend to Ubuntu LXC
   - Set up Git repository with real machines
   - Onboard first few machines
   - Test with real operations

3. **Phase 3: Production Frontend**
   - Copy frontend to Ubuntu LXC
   - Update API URLs to point to localhost:8000
   - Test integration
   - Go live

4. **Phase 4: Keep Both**
   - Demo instance on Windows for testing
   - Production instance on LXC for operations
   - Both running simultaneously
   - No conflicts, clean separation

---

## Quick Start: Dual Setup

### Demo Instance (Windows - Already Done!)
```bash
# Just open in browser
start index.html
```

### Production Instance (Ubuntu LXC - To Do)
```bash
# 1. Deploy backend
cd deployment
sudo ./install.sh

# 2. Configure
sudo nano /etc/linkops/config.ini
# Update Git repository URL

# 3. Copy SSH keys
sudo cp /path/to/key /var/lib/linkops/keys/
sudo chmod 600 /var/lib/linkops/keys/*

# 4. Start service
sudo systemctl start linkopsd

# 5. Copy frontend
sudo mkdir -p /var/www/linkops
sudo cp -r frontend/* /var/www/linkops/

# 6. Update frontend API URL
sudo nano /var/www/linkops/js/config.js
# Set: apiBaseUrl: 'http://localhost:8000'

# 7. Serve frontend (using nginx or python)
cd /var/www/linkops
python3 -m http.server 80
```

---

## Summary

**Answer to your question:** Yes, absolutely possible!

**Recommended approach:**
1. **Keep demo on Windows** - Already working, perfect for testing
2. **Deploy production on Ubuntu LXC** - Real backend + real operations
3. **Run both simultaneously** - No conflicts, clean separation

**Benefits:**
- ✅ Demo never affects production
- ✅ Can test changes safely
- ✅ Can show demos without production access
- ✅ Easy to compare demo vs real behavior
- ✅ Production data stays secure on LXC

**Next steps:**
1. Deploy backend to Ubuntu LXC (follow `deployment/README.md`)
2. Onboard your first real machine (follow `MACHINE_ONBOARDING_GUIDE.md`)
3. Test with real operations
4. Keep Windows demo for testing/demos

---

**Guide Version:** 1.0  
**Last Updated:** January 28, 2026  
**Compatible with:** LinkOps v1.0
