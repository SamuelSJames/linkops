/**
 * LinkOps - Main Application JavaScript
 * Handles tab navigation and global functionality
 */

// Check authentication on page load
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    initTabNavigation();
    initThemeSelector();
    loadTheme();
});

/**
 * Check if user is authenticated
 */
function checkAuth() {
    const authToken = sessionStorage.getItem('authToken');
    
    if (!authToken) {
        // Redirect to login if not authenticated
        window.location.href = 'login.html';
        return;
    }
    
    // Load user info
    const user = JSON.parse(sessionStorage.getItem('user') || '{}');
    const userNameElement = document.querySelector('.user-name');
    if (userNameElement && user.username) {
        userNameElement.textContent = user.username;
    }
}

/**
 * Initialize tab navigation
 */
function initTabNavigation() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.getAttribute('data-tab');
            
            // Remove active class from all buttons and contents
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked button and corresponding content
            button.classList.add('active');
            const targetContent = document.getElementById(`${targetTab}-tab`);
            if (targetContent) {
                targetContent.classList.add('active');
            }
            
            // Store active tab in session
            sessionStorage.setItem('activeTab', targetTab);
        });
    });
    
    // Restore last active tab
    const lastActiveTab = sessionStorage.getItem('activeTab');
    if (lastActiveTab) {
        const targetButton = document.querySelector(`[data-tab="${lastActiveTab}"]`);
        if (targetButton) {
            targetButton.click();
        }
    }
}

/**
 * Initialize theme selector
 */
function initThemeSelector() {
    const themeButtons = document.querySelectorAll('.theme-btn');
    
    themeButtons.forEach(button => {
        button.addEventListener('click', () => {
            const theme = button.getAttribute('data-theme');
            setTheme(theme);
        });
    });
}

/**
 * Set theme
 */
function setTheme(theme) {
    // Update body data attribute
    document.body.setAttribute('data-theme', theme);
    
    // Update active button
    const themeButtons = document.querySelectorAll('.theme-btn');
    themeButtons.forEach(btn => {
        if (btn.getAttribute('data-theme') === theme) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    // Update app icon
    const appIcon = document.querySelector('.app-icon');
    if (appIcon) {
        appIcon.src = `assets/branding/linkops_icon_${theme}.svg`;
    }
    
    // Update footer logo
    const footerLogo = document.getElementById('footerLogo');
    if (footerLogo) {
        footerLogo.src = `assets/branding/sns_net_solutions_${theme}.svg`;
    }
    
    // Save theme preference
    localStorage.setItem('theme', theme);
}

/**
 * Load saved theme
 */
function loadTheme() {
    const savedTheme = localStorage.getItem('theme') || 'gray';
    setTheme(savedTheme);
}

/**
 * Logout user
 */
function logout() {
    // Clear session
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('activeTab');
    
    // Redirect to login
    window.location.href = 'login.html';
}

/**
 * Format timestamp to relative time
 */
function formatRelativeTime(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (seconds < 60) {
        return 'Just now';
    } else if (minutes < 60) {
        return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    } else if (hours < 24) {
        return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    } else {
        return `${days} day${days !== 1 ? 's' : ''} ago`;
    }
}

/**
 * Format latency with color coding
 */
function formatLatency(ms) {
    let className = 'good';
    if (ms > 100) className = 'medium';
    if (ms > 200) className = 'poor';
    
    return {
        value: `${ms}ms`,
        className: className
    };
}

/**
 * Get status class based on value
 */
function getStatusClass(status) {
    const statusMap = {
        'online': 'success',
        'healthy': 'success',
        'connected': 'success',
        'warning': 'warning',
        'degraded': 'warning',
        'offline': 'error',
        'error': 'error',
        'disconnected': 'error'
    };
    
    return statusMap[status.toLowerCase()] || 'error';
}

/**
 * Utility: Debounce function
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Utility: Throttle function
 */
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Export functions for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        checkAuth,
        logout,
        formatRelativeTime,
        formatLatency,
        getStatusClass,
        debounce,
        throttle
    };
}
