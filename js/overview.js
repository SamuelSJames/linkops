/**
 * LinkOps - Overview Tab JavaScript
 * Handles overview data display and updates
 */

// Demo data for 10 machines
const DEMO_MACHINES = [
    {
        id: 'vps-linode-01',
        name: 'vps-linode-01',
        type: 'VPS',
        provider: 'Linode',
        icon: 'assets/logos/linode.svg',
        enrolled: true,
        enrollmentId: 'LINKOPS-8f3a2c6d-1b7e-4c7a-9c2a-3f1a7d2c9c10',
        ssh: true,
        latency: 45,
        lastSeen: Date.now() - 120000, // 2 minutes ago
        status: 'online'
    },
    {
        id: 'vps-racknerd-01',
        name: 'vps-racknerd-01',
        type: 'VPS',
        provider: 'RackNerd',
        icon: 'assets/logos/racknerd.png',
        enrolled: true,
        enrollmentId: 'LINKOPS-7b2c1d3e-4f5a-6b7c-8d9e-0f1a2b3c4d5e',
        ssh: true,
        latency: 62,
        lastSeen: Date.now() - 180000, // 3 minutes ago
        status: 'online'
    },
    {
        id: 'proxmox-cluster-01',
        name: 'proxmox-cluster-01',
        type: 'Proxmox',
        provider: 'Proxmox',
        icon: 'assets/logos/proxmox.svg',
        enrolled: true,
        enrollmentId: 'LINKOPS-9c4d2e3f-5a6b-7c8d-9e0f-1a2b3c4d5e6f',
        ssh: true,
        latency: 12,
        lastSeen: Date.now() - 60000, // 1 minute ago
        status: 'online'
    },
    {
        id: 'vm-ubuntu-web-01',
        name: 'vm-ubuntu-web-01',
        type: 'VM',
        provider: 'Ubuntu',
        icon: 'assets/logos/ubuntu-linux.svg',
        enrolled: true,
        enrollmentId: 'LINKOPS-1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d',
        ssh: true,
        latency: 8,
        lastSeen: Date.now() - 30000, // 30 seconds ago
        status: 'online'
    },
    {
        id: 'vm-ubuntu-db-01',
        name: 'vm-ubuntu-db-01',
        type: 'VM',
        provider: 'Ubuntu',
        icon: 'assets/logos/ubuntu-linux.svg',
        enrolled: true,
        enrollmentId: 'LINKOPS-2b3c4d5e-6f7a-8b9c-0d1e-2f3a4b5c6d7e',
        ssh: true,
        latency: 9,
        lastSeen: Date.now() - 480000, // 8 minutes ago
        status: 'online'
    },
    {
        id: 'vm-alpine-docker-01',
        name: 'vm-alpine-docker-01',
        type: 'VM',
        provider: 'Alpine',
        icon: 'assets/logos/alpine-linux.svg',
        enrolled: true,
        enrollmentId: 'LINKOPS-3c4d5e6f-7a8b-9c0d-1e2f-3a4b5c6d7e8f',
        ssh: true,
        latency: 11,
        lastSeen: Date.now() - 1920000, // 32 minutes ago
        status: 'online'
    },
    {
        id: 'vm-mint-dev-01',
        name: 'vm-mint-dev-01',
        type: 'VM',
        provider: 'Linux Mint',
        icon: 'assets/logos/linux-mint.svg',
        enrolled: true,
        enrollmentId: 'LINKOPS-4d5e6f7a-8b9c-0d1e-2f3a-4b5c6d7e8f9a',
        ssh: true,
        latency: 15,
        lastSeen: Date.now() - 300000, // 5 minutes ago
        status: 'online'
    },
    {
        id: 'vm-docker-host-01',
        name: 'vm-docker-host-01',
        type: 'VM',
        provider: 'Docker',
        icon: 'assets/logos/docker.svg',
        enrolled: true,
        enrollmentId: 'LINKOPS-5e6f7a8b-9c0d-1e2f-3a4b-5c6d7e8f9a0b',
        ssh: true,
        latency: 10,
        lastSeen: Date.now() - 240000, // 4 minutes ago
        status: 'online'
    },
    {
        id: 'vm-nginx-proxy-01',
        name: 'vm-nginx-proxy-01',
        type: 'VM',
        provider: 'Nginx',
        icon: 'assets/logos/nginx-proxy-manager.svg',
        enrolled: true,
        enrollmentId: 'LINKOPS-6f7a8b9c-0d1e-2f3a-4b5c-6d7e8f9a0b1c',
        ssh: true,
        latency: 7,
        lastSeen: Date.now() - 90000, // 1.5 minutes ago
        status: 'online'
    },
    {
        id: 'vm-gitea-01',
        name: 'vm-gitea-01',
        type: 'VM',
        provider: 'Gitea',
        icon: 'assets/logos/gitea.svg',
        enrolled: true,
        enrollmentId: 'LINKOPS-7a8b9c0d-1e2f-3a4b-5c6d-7e8f9a0b1c2d',
        ssh: true,
        latency: 13,
        lastSeen: Date.now() - 600000, // 10 minutes ago
        status: 'online'
    }
];

// Initialize overview on page load
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('overview-tab')) {
        initOverview();
    }
});

/**
 * Initialize overview tab
 */
function initOverview() {
    renderHealthTable();
    
    // Auto-refresh every 30 seconds
    setInterval(() => {
        refreshHealthTable();
    }, 30000);
}

/**
 * Render health table
 */
function renderHealthTable() {
    const tbody = document.getElementById('healthTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    DEMO_MACHINES.forEach(machine => {
        const row = createHealthTableRow(machine);
        tbody.appendChild(row);
    });
}

/**
 * Create health table row
 */
function createHealthTableRow(machine) {
    const tr = document.createElement('tr');
    
    // Status indicator
    const statusTd = document.createElement('td');
    statusTd.className = 'col-status';
    const statusIndicator = document.createElement('span');
    statusIndicator.className = `status-indicator ${getStatusClass(machine.status)}`;
    statusTd.appendChild(statusIndicator);
    tr.appendChild(statusTd);
    
    // Machine name with icon
    const nameTd = document.createElement('td');
    nameTd.className = 'col-name';
    const nameDiv = document.createElement('div');
    nameDiv.className = 'machine-name';
    
    const icon = document.createElement('img');
    icon.src = machine.icon;
    icon.alt = machine.provider;
    icon.className = 'machine-icon';
    icon.onerror = function() {
        this.style.display = 'none';
    };
    
    const label = document.createElement('span');
    label.className = 'machine-label';
    label.textContent = machine.name;
    
    nameDiv.appendChild(icon);
    nameDiv.appendChild(label);
    nameTd.appendChild(nameDiv);
    tr.appendChild(nameTd);
    
    // Type
    const typeTd = document.createElement('td');
    typeTd.className = 'col-type';
    const typeBadge = document.createElement('span');
    typeBadge.className = 'machine-type';
    typeBadge.textContent = machine.type;
    typeTd.appendChild(typeBadge);
    tr.appendChild(typeTd);
    
    // Enrolled
    const enrolledTd = document.createElement('td');
    enrolledTd.className = 'col-enrolled';
    const enrolledBadge = document.createElement('span');
    enrolledBadge.className = `status-badge ${machine.enrolled ? 'success' : 'error'}`;
    enrolledBadge.innerHTML = machine.enrolled ? 
        '<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M10 3L4.5 8.5L2 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg> Yes' :
        '<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M9 3L3 9M3 3l6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg> No';
    enrolledTd.appendChild(enrolledBadge);
    tr.appendChild(enrolledTd);
    
    // SSH
    const sshTd = document.createElement('td');
    sshTd.className = 'col-ssh';
    const sshBadge = document.createElement('span');
    sshBadge.className = `status-badge ${machine.ssh ? 'success' : 'error'}`;
    sshBadge.innerHTML = machine.ssh ? 
        '<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M10 3L4.5 8.5L2 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg> OK' :
        '<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M9 3L3 9M3 3l6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg> Failed';
    sshTd.appendChild(sshBadge);
    tr.appendChild(sshTd);
    
    // Latency
    const latencyTd = document.createElement('td');
    latencyTd.className = 'col-latency';
    const latencyInfo = formatLatency(machine.latency);
    const latencySpan = document.createElement('span');
    latencySpan.className = `latency ${latencyInfo.className}`;
    latencySpan.textContent = latencyInfo.value;
    latencyTd.appendChild(latencySpan);
    tr.appendChild(latencyTd);
    
    // Last seen
    const lastSeenTd = document.createElement('td');
    lastSeenTd.className = 'col-last-seen';
    const lastSeenSpan = document.createElement('span');
    lastSeenSpan.className = 'last-seen';
    lastSeenSpan.textContent = formatRelativeTime(machine.lastSeen);
    lastSeenTd.appendChild(lastSeenSpan);
    tr.appendChild(lastSeenTd);
    
    return tr;
}

/**
 * Refresh health table (simulate live updates)
 */
function refreshHealthTable() {
    // Update last seen times
    DEMO_MACHINES.forEach(machine => {
        // Randomly update some machines
        if (Math.random() > 0.7) {
            machine.lastSeen = Date.now();
            machine.latency = Math.floor(Math.random() * 50) + 5;
        }
    });
    
    renderHealthTable();
}

/**
 * Get machine by ID
 */
function getMachineById(id) {
    return DEMO_MACHINES.find(m => m.id === id);
}

/**
 * Get machines by type
 */
function getMachinesByType(type) {
    return DEMO_MACHINES.filter(m => m.type === type);
}

/**
 * Get infrastructure summary
 */
function getInfrastructureSummary() {
    return {
        vps: getMachinesByType('VPS').length,
        proxmox: getMachinesByType('Proxmox').length,
        vm: getMachinesByType('VM').length,
        total: DEMO_MACHINES.length,
        enrolled: DEMO_MACHINES.filter(m => m.enrolled).length,
        reachable: DEMO_MACHINES.filter(m => m.ssh).length
    };
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        DEMO_MACHINES,
        getMachineById,
        getMachinesByType,
        getInfrastructureSummary
    };
}
