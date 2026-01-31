/**
 * LinkOps - Terminal Tab JavaScript
 * Handles multi-pane terminal workspace
 */

let currentLayout = 1;
let terminalPanes = [];
let availableMachines = [];

// Initialize terminal tab
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('terminal-tab')) {
        setTimeout(() => {
            initTerminal();
        }, 100);
    }
});

/**
 * Initialize terminal tab
 */
function initTerminal() {
    // Get available machines
    if (typeof DEMO_MACHINES !== 'undefined') {
        availableMachines = DEMO_MACHINES.filter(m => m.ssh && m.enrolled);
    }
    
    initLayoutSelector();
    initConnectAll();
    setLayout(1); // Start with single pane
}

/**
 * Initialize layout selector
 */
function initLayoutSelector() {
    const layoutButtons = document.querySelectorAll('.layout-btn');
    
    layoutButtons.forEach(button => {
        button.addEventListener('click', () => {
            const layout = parseInt(button.getAttribute('data-layout'));
            
            // Update active button
            layoutButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Set layout
            setLayout(layout);
        });
    });
}

/**
 * Set terminal layout
 */
function setLayout(layout) {
    currentLayout = layout;
    const workspace = document.getElementById('terminalWorkspace');
    if (!workspace) return;
    
    // Update workspace class
    workspace.className = `terminal-workspace layout-${layout}`;
    
    // Clear existing panes
    workspace.innerHTML = '';
    terminalPanes = [];
    
    // Create panes based on layout
    for (let i = 0; i < layout; i++) {
        const pane = createTerminalPane(i);
        workspace.appendChild(pane);
        terminalPanes.push({
            id: i,
            element: pane,
            machine: null,
            connected: false
        });
    }
}

/**
 * Create terminal pane
 */
function createTerminalPane(index) {
    const pane = document.createElement('div');
    pane.className = 'terminal-pane';
    pane.setAttribute('data-pane-id', index);
    
    // Header
    const header = document.createElement('div');
    header.className = 'terminal-pane-header';
    
    const info = document.createElement('div');
    info.className = 'terminal-pane-info';
    info.innerHTML = `
        <svg class="terminal-pane-icon" viewBox="0 0 20 20" fill="none">
            <rect x="2" y="3" width="16" height="14" rx="2" stroke="currentColor" stroke-width="1.5" fill="none"/>
            <path d="M5 7l3 2-3 2M9 11h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
        <div class="terminal-pane-details">
            <div class="terminal-pane-name">Terminal ${index + 1}</div>
            <div class="terminal-pane-status">
                <span class="status-dot disconnected"></span>
                <span>Not connected</span>
            </div>
        </div>
    `;
    
    const actions = document.createElement('div');
    actions.className = 'terminal-pane-actions';
    actions.innerHTML = `
        <button class="terminal-pane-btn disconnect-btn" title="Disconnect" style="display: none;">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M10 4L4 10M4 4l6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
        </button>
    `;
    
    header.appendChild(info);
    header.appendChild(actions);
    
    // Body
    const body = document.createElement('div');
    body.className = 'terminal-pane-body';
    body.innerHTML = createEmptyTerminalContent(index);
    
    pane.appendChild(header);
    pane.appendChild(body);
    
    // Focus on click
    pane.addEventListener('click', () => {
        document.querySelectorAll('.terminal-pane').forEach(p => p.classList.remove('focused'));
        pane.classList.add('focused');
    });
    
    return pane;
}

/**
 * Create empty terminal content
 */
function createEmptyTerminalContent(index) {
    const machineOptions = availableMachines.map(m => 
        `<option value="${m.id}">${m.name}</option>`
    ).join('');
    
    return `
        <div class="terminal-empty">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <rect x="6" y="8" width="36" height="32" rx="4" stroke="currentColor" stroke-width="2"/>
                <path d="M12 16l6 4-6 4M20 24h8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
            <div class="terminal-empty-title">No Connection</div>
            <div class="terminal-empty-text">Select a machine to connect</div>
            <div class="terminal-select">
                <select id="machine-select-${index}">
                    <option value="">Select machine...</option>
                    ${machineOptions}
                </select>
            </div>
            <button class="connect-btn-small" onclick="connectPane(${index})">Connect</button>
        </div>
    `;
}

/**
 * Connect pane to machine
 */
window.connectPane = function(paneIndex) {
    const select = document.getElementById(`machine-select-${paneIndex}`);
    if (!select) return;
    
    const machineId = select.value;
    if (!machineId) {
        alert('Please select a machine');
        return;
    }
    
    const machine = availableMachines.find(m => m.id === machineId);
    if (!machine) return;
    
    const pane = terminalPanes[paneIndex];
    if (!pane) return;
    
    // Update pane state
    pane.machine = machine;
    pane.connected = true;
    
    // Update UI
    updatePaneConnection(paneIndex, machine);
    
    // Simulate SSH connection
    simulateSSHConnection(paneIndex, machine);
};

/**
 * Update pane connection UI
 */
function updatePaneConnection(paneIndex, machine) {
    const pane = document.querySelector(`[data-pane-id="${paneIndex}"]`);
    if (!pane) return;
    
    // Update header
    const nameEl = pane.querySelector('.terminal-pane-name');
    const statusEl = pane.querySelector('.terminal-pane-status');
    const iconEl = pane.querySelector('.terminal-pane-icon');
    const disconnectBtn = pane.querySelector('.disconnect-btn');
    
    if (nameEl) nameEl.textContent = machine.name;
    if (statusEl) {
        statusEl.innerHTML = `
            <span class="status-dot connecting"></span>
            <span>Connecting...</span>
        `;
    }
    
    // Update icon
    if (iconEl && machine.icon) {
        const img = document.createElement('img');
        img.src = machine.icon;
        img.className = 'terminal-pane-icon';
        img.onerror = function() { this.style.display = 'none'; };
        iconEl.replaceWith(img);
    }
    
    // Show disconnect button
    if (disconnectBtn) {
        disconnectBtn.style.display = 'flex';
        disconnectBtn.onclick = () => disconnectPane(paneIndex);
    }
}

/**
 * Simulate SSH connection
 */
function simulateSSHConnection(paneIndex, machine) {
    const pane = document.querySelector(`[data-pane-id="${paneIndex}"]`);
    if (!pane) return;
    
    const body = pane.querySelector('.terminal-pane-body');
    if (!body) return;
    
    // Show connecting message
    body.innerHTML = '<div class="terminal-output"></div>';
    const output = body.querySelector('.terminal-output');
    
    addTerminalLine(output, 'info', `Connecting to ${machine.name}...`);
    addTerminalLine(output, 'muted', `SSH ${machine.name} port 22`);
    
    setTimeout(() => {
        addTerminalLine(output, 'success', `✓ Connected to ${machine.name}`);
        addTerminalLine(output, 'muted', `Enrollment ID: ${machine.enrollmentId}`);
        addTerminalLine(output, 'muted', '');
        
        // Update status to connected
        const statusEl = pane.querySelector('.terminal-pane-status');
        if (statusEl) {
            statusEl.innerHTML = `
                <span class="status-dot connected"></span>
                <span>Connected • ${machine.latency}ms</span>
            `;
        }
        
        // Show welcome message
        setTimeout(() => {
            addTerminalLine(output, 'muted', `Welcome to ${machine.provider}`);
            addTerminalLine(output, 'muted', `Last login: ${formatRelativeTime(machine.lastSeen)}`);
            addTerminalLine(output, 'muted', '');
            addTerminalLine(output, 'prompt', `root@${machine.name}:~# `);
            
            // Add cursor
            const cursor = document.createElement('span');
            cursor.className = 'terminal-cursor';
            output.appendChild(cursor);
        }, 500);
    }, 1500);
}

/**
 * Disconnect pane
 */
function disconnectPane(paneIndex) {
    const pane = terminalPanes[paneIndex];
    if (!pane) return;
    
    pane.machine = null;
    pane.connected = false;
    
    const paneEl = document.querySelector(`[data-pane-id="${paneIndex}"]`);
    if (!paneEl) return;
    
    // Reset header
    const nameEl = paneEl.querySelector('.terminal-pane-name');
    const statusEl = paneEl.querySelector('.terminal-pane-status');
    const iconEl = paneEl.querySelector('.terminal-pane-icon');
    const disconnectBtn = paneEl.querySelector('.disconnect-btn');
    
    if (nameEl) nameEl.textContent = `Terminal ${paneIndex + 1}`;
    if (statusEl) {
        statusEl.innerHTML = `
            <span class="status-dot disconnected"></span>
            <span>Not connected</span>
        `;
    }
    
    // Reset icon
    if (iconEl && iconEl.tagName === 'IMG') {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('class', 'terminal-pane-icon');
        svg.setAttribute('viewBox', '0 0 20 20');
        svg.setAttribute('fill', 'none');
        svg.innerHTML = `
            <rect x="2" y="3" width="16" height="14" rx="2" stroke="currentColor" stroke-width="1.5" fill="none"/>
            <path d="M5 7l3 2-3 2M9 11h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        `;
        iconEl.replaceWith(svg);
    }
    
    // Hide disconnect button
    if (disconnectBtn) disconnectBtn.style.display = 'none';
    
    // Reset body
    const body = paneEl.querySelector('.terminal-pane-body');
    if (body) {
        body.innerHTML = createEmptyTerminalContent(paneIndex);
    }
}

/**
 * Initialize Connect All button
 */
function initConnectAll() {
    const btn = document.getElementById('connectAllBtn');
    if (!btn) return;
    
    btn.addEventListener('click', () => {
        if (availableMachines.length === 0) {
            alert('No machines available for connection');
            return;
        }
        
        // Connect each pane to a different machine
        terminalPanes.forEach((pane, index) => {
            if (!pane.connected && index < availableMachines.length) {
                const machine = availableMachines[index];
                
                // Set the select value
                const select = document.getElementById(`machine-select-${index}`);
                if (select) {
                    select.value = machine.id;
                }
                
                // Connect after a delay
                setTimeout(() => {
                    connectPane(index);
                }, index * 500);
            }
        });
    });
}

/**
 * Add line to terminal output
 */
function addTerminalLine(output, type, text) {
    const line = document.createElement('div');
    line.className = `terminal-line terminal-${type}`;
    line.textContent = text;
    output.appendChild(line);
    
    // Auto-scroll
    const body = output.closest('.terminal-pane-body');
    if (body) {
        body.scrollTop = body.scrollHeight;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        setLayout,
        connectPane,
        disconnectPane
    };
}
