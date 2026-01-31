/**
 * LinkOps - Links Tab JavaScript
 * Handles links table and topology view
 */

// Import demo machines from overview
let linksMachines = [];

// Initialize links tab on page load
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('links-tab')) {
        // Wait for overview data to load
        setTimeout(() => {
            if (typeof DEMO_MACHINES !== 'undefined') {
                linksMachines = DEMO_MACHINES;
            }
            initLinks();
        }, 100);
    }
});

/**
 * Initialize links tab
 */
function initLinks() {
    initViewToggle();
    renderLinksTable();
    renderTopologyView();
    initSearch();
    initFilters();
}

/**
 * Initialize view toggle
 */
function initViewToggle() {
    const viewButtons = document.querySelectorAll('.view-btn');
    const views = document.querySelectorAll('.links-view');
    
    viewButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetView = button.getAttribute('data-view');
            
            // Update buttons
            viewButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Update views
            views.forEach(view => view.classList.remove('active'));
            const targetElement = document.getElementById(`${targetView}-view`);
            if (targetElement) {
                targetElement.classList.add('active');
            }
            
            // Re-render topology if switching to it
            if (targetView === 'topology') {
                renderTopologyView();
            }
        });
    });
}

/**
 * Render links table
 */
function renderLinksTable() {
    const tbody = document.getElementById('linksTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    linksMachines.forEach(machine => {
        const row = createLinksTableRow(machine);
        tbody.appendChild(row);
    });
}

/**
 * Create links table row
 */
function createLinksTableRow(machine) {
    const tr = document.createElement('tr');
    tr.setAttribute('data-machine-id', machine.id);
    
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
    
    // Provider
    const providerTd = document.createElement('td');
    providerTd.className = 'col-provider';
    providerTd.textContent = machine.provider;
    tr.appendChild(providerTd);
    
    // Enrollment ID
    const enrollmentTd = document.createElement('td');
    enrollmentTd.className = 'col-enrollment';
    if (machine.enrolled && machine.enrollmentId) {
        const enrollmentSpan = document.createElement('span');
        enrollmentSpan.className = 'enrollment-id';
        enrollmentSpan.textContent = machine.enrollmentId;
        enrollmentSpan.title = 'Click to copy';
        enrollmentSpan.style.cursor = 'pointer';
        enrollmentSpan.addEventListener('click', (e) => {
            e.stopPropagation();
            copyToClipboard(machine.enrollmentId);
        });
        enrollmentTd.appendChild(enrollmentSpan);
    } else {
        enrollmentTd.innerHTML = '<span style="color: var(--text-muted)">Not enrolled</span>';
    }
    tr.appendChild(enrollmentTd);
    
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
    
    // Actions
    const actionsTd = document.createElement('td');
    actionsTd.className = 'col-actions';
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'action-buttons';
    
    // Terminal button
    const terminalBtn = document.createElement('button');
    terminalBtn.className = 'action-btn terminal-btn';
    terminalBtn.title = 'Open Terminal';
    terminalBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 4l3 3-3 3M6 10h5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    terminalBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openTerminal(machine.id);
    });
    
    // SSH button
    const sshBtn = document.createElement('button');
    sshBtn.className = 'action-btn ssh-btn';
    sshBtn.title = 'SSH Connect';
    sshBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="2" y="3" width="10" height="8" rx="1" stroke="currentColor" stroke-width="1.5" fill="none"/><path d="M5 6h4M5 8h2" stroke="currentColor" stroke-width="1.5"/></svg>';
    sshBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        sshConnect(machine.id);
    });
    
    // Info button
    const infoBtn = document.createElement('button');
    infoBtn.className = 'action-btn';
    infoBtn.title = 'Details';
    infoBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5" stroke="currentColor" stroke-width="1.5" fill="none"/><path d="M7 6v4M7 4.5v.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';
    infoBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        showMachineDetails(machine.id);
    });
    
    actionsDiv.appendChild(terminalBtn);
    actionsDiv.appendChild(sshBtn);
    actionsDiv.appendChild(infoBtn);
    actionsTd.appendChild(actionsDiv);
    tr.appendChild(actionsTd);
    
    return tr;
}

/**
 * Render topology view
 */
function renderTopologyView() {
    const container = document.getElementById('topologyContainer');
    if (!container) return;
    
    container.innerHTML = '';
    
    // Create SVG for connections
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.style.position = 'absolute';
    svg.style.top = '0';
    svg.style.left = '0';
    svg.style.width = '100%';
    svg.style.height = '100%';
    svg.style.pointerEvents = 'none';
    svg.style.zIndex = '1';
    container.appendChild(svg);
    
    // Calculate positions for nodes
    const positions = calculateNodePositions(linksMachines, container);
    
    // Draw connections first (behind nodes)
    drawConnections(svg, positions);
    
    // Create nodes
    linksMachines.forEach((machine, index) => {
        const node = createTopologyNode(machine, positions[index]);
        container.appendChild(node);
    });
    
    // Add legend
    const legend = createTopologyLegend();
    container.appendChild(legend);
}

/**
 * Calculate node positions for topology
 */
function calculateNodePositions(machines, container) {
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;
    const padding = 100;
    
    const positions = [];
    
    // Group by type
    const vps = machines.filter(m => m.type === 'VPS');
    const proxmox = machines.filter(m => m.type === 'Proxmox');
    const vms = machines.filter(m => m.type === 'VM');
    
    // Position VPS at top
    vps.forEach((machine, i) => {
        positions.push({
            machine: machine,
            x: (width / (vps.length + 1)) * (i + 1),
            y: padding
        });
    });
    
    // Position Proxmox in center
    proxmox.forEach((machine, i) => {
        positions.push({
            machine: machine,
            x: width / 2,
            y: height / 2
        });
    });
    
    // Position VMs in a circle around Proxmox
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 3;
    
    vms.forEach((machine, i) => {
        const angle = (Math.PI * 2 / vms.length) * i - Math.PI / 2;
        positions.push({
            machine: machine,
            x: centerX + Math.cos(angle) * radius,
            y: centerY + Math.sin(angle) * radius
        });
    });
    
    return positions;
}

/**
 * Draw connections between nodes
 */
function drawConnections(svg, positions) {
    const proxmoxPos = positions.find(p => p.machine.type === 'Proxmox');
    if (!proxmoxPos) return;
    
    // Connect VMs to Proxmox
    positions.forEach(pos => {
        if (pos.machine.type === 'VM') {
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', proxmoxPos.x);
            line.setAttribute('y1', proxmoxPos.y);
            line.setAttribute('x2', pos.x);
            line.setAttribute('y2', pos.y);
            line.setAttribute('class', 'connection-line');
            svg.appendChild(line);
        }
    });
}

/**
 * Create topology node
 */
function createTopologyNode(machine, position) {
    const node = document.createElement('div');
    node.className = 'topology-node';
    node.style.left = `${position.x - 32}px`;
    node.style.top = `${position.y - 32}px`;
    node.style.zIndex = '2';
    
    // Icon wrapper
    const iconWrapper = document.createElement('div');
    iconWrapper.className = 'node-icon-wrapper';
    
    const icon = document.createElement('img');
    icon.src = machine.icon;
    icon.alt = machine.provider;
    icon.onerror = function() {
        this.style.display = 'none';
    };
    
    const statusDot = document.createElement('div');
    statusDot.className = `node-status-dot ${machine.status}`;
    
    iconWrapper.appendChild(icon);
    iconWrapper.appendChild(statusDot);
    
    // Label
    const label = document.createElement('div');
    label.className = 'node-label';
    label.textContent = machine.name;
    
    node.appendChild(iconWrapper);
    node.appendChild(label);
    
    // Click handler
    node.addEventListener('click', () => {
        showMachineDetails(machine.id);
    });
    
    return node;
}

/**
 * Create topology legend
 */
function createTopologyLegend() {
    const legend = document.createElement('div');
    legend.className = 'topology-legend';
    
    const title = document.createElement('div');
    title.className = 'legend-title';
    title.textContent = 'Legend';
    legend.appendChild(title);
    
    const types = [
        { label: 'VPS', color: 'rgba(122, 159, 216, 0.2)' },
        { label: 'Proxmox', color: 'rgba(122, 159, 216, 0.3)' },
        { label: 'VM', color: 'rgba(122, 159, 216, 0.15)' }
    ];
    
    types.forEach(type => {
        const item = document.createElement('div');
        item.className = 'legend-item';
        
        const icon = document.createElement('div');
        icon.className = 'legend-icon';
        icon.style.background = type.color;
        
        const text = document.createElement('span');
        text.textContent = type.label;
        
        item.appendChild(icon);
        item.appendChild(text);
        legend.appendChild(item);
    });
    
    return legend;
}

/**
 * Initialize search
 */
function initSearch() {
    const searchInput = document.getElementById('linksSearch');
    if (!searchInput) return;
    
    searchInput.addEventListener('input', debounce((e) => {
        filterTable();
    }, 300));
}

/**
 * Initialize filters
 */
function initFilters() {
    const filterSelects = document.querySelectorAll('.filter-select');
    
    filterSelects.forEach(select => {
        select.addEventListener('change', () => {
            filterTable();
        });
    });
}

/**
 * Filter table based on search and filters
 */
function filterTable() {
    const searchTerm = document.getElementById('linksSearch')?.value.toLowerCase() || '';
    const typeFilter = document.querySelector('.filter-select[value]')?.value || '';
    
    const rows = document.querySelectorAll('#linksTableBody tr');
    
    rows.forEach(row => {
        const machineId = row.getAttribute('data-machine-id');
        const machine = linksMachines.find(m => m.id === machineId);
        
        if (!machine) {
            row.style.display = 'none';
            return;
        }
        
        // Search filter
        const matchesSearch = !searchTerm || 
            machine.name.toLowerCase().includes(searchTerm) ||
            machine.provider.toLowerCase().includes(searchTerm) ||
            machine.type.toLowerCase().includes(searchTerm);
        
        // Type filter
        const matchesType = !typeFilter || machine.type.toLowerCase() === typeFilter;
        
        // Show/hide row
        row.style.display = (matchesSearch && matchesType) ? '' : 'none';
    });
}

/**
 * Copy to clipboard
 */
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        // Show temporary success message
        console.log('Copied to clipboard:', text);
        // TODO: Add toast notification
    });
}

/**
 * Open terminal for machine
 */
function openTerminal(machineId) {
    console.log('Opening terminal for:', machineId);
    // TODO: Switch to terminal tab and open connection
}

/**
 * SSH connect to machine
 */
function sshConnect(machineId) {
    console.log('SSH connecting to:', machineId);
    // TODO: Initiate SSH connection
}

/**
 * Show machine details
 */
function showMachineDetails(machineId) {
    const machine = linksMachines.find(m => m.id === machineId);
    if (!machine) return;
    
    console.log('Machine details:', machine);
    // TODO: Show details modal/panel
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        renderLinksTable,
        renderTopologyView
    };
}
