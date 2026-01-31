/**
 * LinkOps - Operations Tab JavaScript
 * Handles script execution and operation history
 */

// Demo operations data
const DEMO_OPERATIONS_HISTORY = [
    {
        id: 'OP-10291',
        script: 'baseline',
        scriptName: 'Baseline Check',
        targets: 3,
        status: 'success',
        started: Date.now() - 7200000, // 2 hours ago
        duration: 68000 // 68 seconds
    },
    {
        id: 'OP-10290',
        script: 'security_audit',
        scriptName: 'Security Audit',
        targets: 2,
        status: 'failed',
        started: Date.now() - 10800000, // 3 hours ago
        duration: 102000 // 102 seconds
    },
    {
        id: 'OP-10289',
        script: 'install_crowdsec',
        scriptName: 'Install CrowdSec',
        targets: 1,
        status: 'success',
        started: Date.now() - 14400000, // 4 hours ago
        duration: 245000 // 245 seconds
    }
];

// Available scripts with flags
const AVAILABLE_SCRIPTS = [
    {
        id: 'install_nano',
        name: 'Install Nano',
        emoji: '📝',
        flags: ['--yes', '--quiet', '--no-recommends']
    },
    {
        id: 'install_vim',
        name: 'Install Vim',
        emoji: '✏️',
        flags: ['--yes', '--quiet', '--enhanced']
    },
    {
        id: 'install_crowdsec',
        name: 'Install CrowdSec',
        emoji: '🛡️',
        flags: ['--auto-config', '--enable-service', '--start-now']
    },
    {
        id: 'install_wazuh',
        name: 'Install Wazuh Agent',
        emoji: '👁️',
        flags: ['--manager-ip', '--auto-enroll', '--enable-service']
    },
    {
        id: 'install_docker',
        name: 'Install Docker',
        emoji: '🐳',
        flags: ['--add-user', '--enable-service', '--start-now']
    },
    {
        id: 'install_nginx',
        name: 'Install Nginx',
        emoji: '🌐',
        flags: ['--enable-service', '--configure-firewall', '--start-now']
    },
    {
        id: 'baseline',
        name: 'Baseline Check',
        emoji: '📊',
        flags: ['--verbose', '--save-output', '--json-format']
    },
    {
        id: 'security_audit',
        name: 'Security Audit',
        emoji: '🔒',
        flags: ['--full-scan', '--save-report', '--fix-issues']
    },
    {
        id: 'update_system',
        name: 'Update System',
        emoji: '🔄',
        flags: ['--yes', '--auto-reboot', '--clean-cache']
    },
    {
        id: 'install_fail2ban',
        name: 'Install Fail2ban',
        emoji: '🚫',
        flags: ['--enable-ssh', '--enable-service', '--start-now']
    }
];

let selectedScripts = [];
let selectedFlags = {};
let selectedTargets = [];

// Initialize operations tab
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('operations-tab')) {
        setTimeout(() => {
            initOperations();
        }, 100);
    }
});

/**
 * Initialize operations tab
 */
function initOperations() {
    renderOperationsList();
    renderScriptsSelection();
    renderTargetsSelection();
    initExecutionForm();
    initClearOutput();
}

/**
 * Render operations list
 */
function renderOperationsList() {
    const list = document.getElementById('operationsList');
    if (!list) return;
    
    list.innerHTML = '';
    
    DEMO_OPERATIONS_HISTORY.forEach(op => {
        const item = createOperationItem(op);
        list.appendChild(item);
    });
}

/**
 * Create operation list item
 */
function createOperationItem(op) {
    const div = document.createElement('div');
    div.className = 'operation-item';
    
    const statusClass = op.status === 'success' ? 'success' : op.status === 'failed' ? 'error' : 'warning';
    const statusIcon = op.status === 'success' ? '✓' : op.status === 'failed' ? '✗' : '⚠';
    
    div.innerHTML = `
        <div class="operation-item-header">
            <span class="operation-item-id">${op.id}</span>
            <span class="operation-item-time">${formatRelativeTime(op.started)}</span>
        </div>
        <div class="operation-item-script">${op.scriptName}</div>
        <div class="operation-item-footer">
            <span>${op.targets} target${op.targets !== 1 ? 's' : ''}</span>
            <span class="terminal-line ${statusClass}">${statusIcon} ${op.status.toUpperCase()}</span>
        </div>
    `;
    
    return div;
}

/**
 * Render scripts selection
 */
function renderScriptsSelection() {
    const container = document.getElementById('scriptsContainer');
    if (!container) return;
    
    container.innerHTML = '';
    
    AVAILABLE_SCRIPTS.forEach(script => {
        const div = document.createElement('div');
        div.className = 'script-checkbox';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `script-${script.id}`;
        checkbox.value = script.id;
        checkbox.addEventListener('change', (e) => handleScriptSelection(e, script));
        
        const label = document.createElement('label');
        label.className = 'script-checkbox-label';
        label.htmlFor = `script-${script.id}`;
        label.innerHTML = `<span class="script-emoji">${script.emoji}</span> ${script.name}`;
        
        div.appendChild(checkbox);
        div.appendChild(label);
        container.appendChild(div);
    });
}

/**
 * Handle script selection
 */
function handleScriptSelection(e, script) {
    if (e.target.checked) {
        if (selectedScripts.length >= 10) {
            e.target.checked = false;
            alert('Maximum 10 scripts can be selected');
            return;
        }
        selectedScripts.push(script);
    } else {
        selectedScripts = selectedScripts.filter(s => s.id !== script.id);
        delete selectedFlags[script.id];
    }
    
    updateFlagsDisplay();
}

/**
 * Update flags display based on selected scripts
 */
function updateFlagsDisplay() {
    const container = document.getElementById('flagsContainer');
    if (!container) return;
    
    if (selectedScripts.length === 0) {
        container.innerHTML = '<div class="empty-message">Select a script to see available flags</div>';
        return;
    }
    
    container.innerHTML = '';
    
    selectedScripts.forEach(script => {
        script.flags.forEach(flag => {
            const div = document.createElement('div');
            div.className = 'flag-checkbox';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `flag-${script.id}-${flag}`;
            checkbox.value = flag;
            checkbox.addEventListener('change', (e) => {
                if (!selectedFlags[script.id]) selectedFlags[script.id] = [];
                if (e.target.checked) {
                    selectedFlags[script.id].push(flag);
                } else {
                    selectedFlags[script.id] = selectedFlags[script.id].filter(f => f !== flag);
                }
            });
            
            const label = document.createElement('label');
            label.htmlFor = `flag-${script.id}-${flag}`;
            label.textContent = `${script.name}: ${flag}`;
            label.style.cursor = 'pointer';
            
            div.appendChild(checkbox);
            div.appendChild(label);
            container.appendChild(div);
        });
    });
}

/**
 * Render targets selection
 */
function renderTargetsSelection() {
    const grid = document.getElementById('targetsGrid');
    if (!grid) return;
    
    // Wait for machines data
    if (typeof DEMO_MACHINES === 'undefined') {
        setTimeout(renderTargetsSelection, 100);
        return;
    }
    
    grid.innerHTML = '';
    
    DEMO_MACHINES.forEach(machine => {
        if (!machine.ssh || !machine.enrolled) return; // Only show SSH-enabled and enrolled machines
        
        const div = document.createElement('div');
        div.className = 'target-checkbox';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `target-${machine.id}`;
        checkbox.value = machine.id;
        checkbox.addEventListener('change', (e) => {
            if (e.target.checked) {
                selectedTargets.push(machine.id);
            } else {
                selectedTargets = selectedTargets.filter(t => t !== machine.id);
            }
        });
        
        const label = document.createElement('label');
        label.className = 'target-checkbox-label';
        label.htmlFor = `target-${machine.id}`;
        
        const icon = document.createElement('img');
        icon.src = machine.icon;
        icon.alt = machine.provider;
        icon.className = 'target-icon';
        icon.onerror = function() { this.style.display = 'none'; };
        
        const name = document.createElement('span');
        name.textContent = machine.name;
        
        label.appendChild(icon);
        label.appendChild(name);
        div.appendChild(checkbox);
        div.appendChild(label);
        grid.appendChild(div);
    });
}

/**
 * Initialize execution form
 */
function initExecutionForm() {
    const form = document.getElementById('executionForm');
    if (!form) return;
    
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        executeScripts();
    });
}

/**
 * Execute selected scripts
 */
function executeScripts() {
    if (selectedScripts.length === 0) {
        alert('Please select at least one script');
        return;
    }
    
    if (selectedTargets.length === 0) {
        alert('Please select at least one target');
        return;
    }
    
    const output = document.getElementById('terminalOutput');
    if (!output) return;
    
    // Clear previous output
    output.innerHTML = '';
    
    // Add execution start message
    addTerminalLine('info', `Starting execution of ${selectedScripts.length} script(s) on ${selectedTargets.length} target(s)...`);
    addTerminalLine('muted', '─'.repeat(60));
    
    // Simulate script execution
    selectedScripts.forEach((script, index) => {
        const packageNum = selectedScripts.length > 1 ? `[${index + 1}] ` : '';
        
        setTimeout(() => {
            addTerminalLine('info', `${packageNum}${script.name} - ${script.id} - STARTED`);
            
            selectedTargets.forEach((targetId, targetIndex) => {
                setTimeout(() => {
                    const machine = DEMO_MACHINES.find(m => m.id === targetId);
                    const success = Math.random() > 0.2; // 80% success rate
                    const status = success ? 'SUCCEEDED' : 'FAILED';
                    const statusClass = success ? 'success' : 'error';
                    
                    addTerminalLine(statusClass, `  └─ ${machine.name}: ${status}`);
                    
                    // Add finished message after last target
                    if (targetIndex === selectedTargets.length - 1) {
                        setTimeout(() => {
                            addTerminalLine('info', `${packageNum}${script.name} - ${script.id} - FINISHED`);
                            
                            // Add completion message after last script
                            if (index === selectedScripts.length - 1) {
                                setTimeout(() => {
                                    addTerminalLine('muted', '─'.repeat(60));
                                    addTerminalLine('success', 'Execution completed');
                                }, 500);
                            }
                        }, 300);
                    }
                }, targetIndex * 400);
            });
        }, index * (selectedTargets.length * 400 + 1000));
    });
}

/**
 * Add line to terminal output
 */
function addTerminalLine(type, text) {
    const output = document.getElementById('terminalOutput');
    if (!output) return;
    
    const line = document.createElement('div');
    line.className = `terminal-line ${type}`;
    line.textContent = text;
    output.appendChild(line);
    
    // Auto-scroll to bottom
    output.scrollTop = output.scrollHeight;
}

/**
 * Initialize clear output button
 */
function initClearOutput() {
    const btn = document.getElementById('clearOutputBtn');
    if (!btn) return;
    
    btn.addEventListener('click', () => {
        const output = document.getElementById('terminalOutput');
        if (output) {
            output.innerHTML = '<div class="terminal-line muted">Ready to execute scripts...</div>';
        }
    });
}

/**
 * Format duration in milliseconds to readable string
 */
function formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
        return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
        return `${minutes}m ${seconds % 60}s`;
    } else {
        return `${seconds}s`;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        AVAILABLE_SCRIPTS
    };
}
