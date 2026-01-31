/**
 * LinkOps - Admin Login Handler
 * Handles authentication and form validation
 */

// Configuration
const CONFIG = {
    apiEndpoint: '/api/auth/login',
    redirectUrl: 'index.html',
    maxAttempts: 5,
    lockoutDuration: 300000 // 5 minutes in milliseconds
};

// State management
let loginAttempts = 0;
let isLocked = false;

// DOM Elements
const loginForm = document.getElementById('loginForm');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const loginButton = document.querySelector('.login-button');
const errorMessage = document.getElementById('errorMessage');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkLockoutStatus();
    setupEventListeners();
    focusUsername();
});

/**
 * Setup event listeners
 */
function setupEventListeners() {
    loginForm.addEventListener('submit', handleLogin);
    
    // Clear error on input
    usernameInput.addEventListener('input', clearError);
    passwordInput.addEventListener('input', clearError);
    
    // Enter key handling
    usernameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            passwordInput.focus();
        }
    });
}

/**
 * Handle login form submission
 */
async function handleLogin(e) {
    e.preventDefault();
    
    // Check if locked out
    if (isLocked) {
        showError('Too many failed attempts. Please try again later.');
        return;
    }
    
    // Get form values
    const username = usernameInput.value.trim();
    const password = passwordInput.value;
    
    // Basic validation
    if (!username || !password) {
        showError('Please enter both username and password.');
        return;
    }
    
    // Show loading state
    setLoading(true);
    clearError();
    
    try {
        // Attempt login
        const result = await authenticateUser(username, password);
        
        if (result.success) {
            handleLoginSuccess(result);
        } else {
            handleLoginFailure(result.message);
        }
    } catch (error) {
        console.error('Login error:', error);
        showError('Connection error. Please try again.');
        setLoading(false);
    }
}

/**
 * Authenticate user with backend
 */
async function authenticateUser(username, password) {
    try {
        const response = await fetch(CONFIG.apiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            return {
                success: true,
                token: data.token,
                user: {
                    username: username,
                    userId: data.user_id,
                    isAdmin: data.is_admin,
                    onboardingCompleted: data.onboarding_completed,
                    onboardingStep: data.onboarding_step
                }
            };
        } else {
            return {
                success: false,
                message: data.detail || 'Invalid username or password'
            };
        }
    } catch (error) {
        console.error('Authentication error:', error);
        return {
            success: false,
            message: 'Connection error. Please try again.'
        };
    }
}

/**
 * Handle successful login
 */
function handleLoginSuccess(result) {
    // Store auth token and user info
    sessionStorage.setItem('authToken', result.token);
    sessionStorage.setItem('linkops_token', result.token);
    sessionStorage.setItem('user', JSON.stringify(result.user));
    
    // Reset attempts
    loginAttempts = 0;
    localStorage.removeItem('loginAttempts');
    localStorage.removeItem('lockoutTime');
    
    // Visual feedback
    loginButton.style.background = '#2ecc71';
    loginButton.querySelector('.button-text').textContent = 'Success';
    
    // Determine redirect based on onboarding status
    let redirectUrl = CONFIG.redirectUrl;
    
    if (!result.user.onboardingCompleted) {
        // User hasn't completed onboarding - redirect to appropriate step
        const step = result.user.onboardingStep || 0;
        
        if (step === 0) {
            redirectUrl = 'onboarding-step1.html';
        } else if (step === 1) {
            redirectUrl = 'onboarding-step2.html';
        } else if (step === 2) {
            redirectUrl = 'onboarding-step3.html';
        } else {
            redirectUrl = 'onboarding-success.html';
        }
    }
    
    // Redirect after short delay
    setTimeout(() => {
        window.location.href = redirectUrl;
    }, 500);
}

/**
 * Handle failed login
 */
function handleLoginFailure(message) {
    loginAttempts++;
    localStorage.setItem('loginAttempts', loginAttempts);
    
    setLoading(false);
    
    // Check if should lock out
    if (loginAttempts >= CONFIG.maxAttempts) {
        lockoutUser();
        showError(`Too many failed attempts. Locked out for ${CONFIG.lockoutDuration / 60000} minutes.`);
    } else {
        const remainingAttempts = CONFIG.maxAttempts - loginAttempts;
        showError(`${message}. ${remainingAttempts} attempt${remainingAttempts !== 1 ? 's' : ''} remaining.`);
    }
    
    // Clear password field
    passwordInput.value = '';
    passwordInput.focus();
}

/**
 * Lock out user after too many attempts
 */
function lockoutUser() {
    isLocked = true;
    const lockoutTime = Date.now() + CONFIG.lockoutDuration;
    localStorage.setItem('lockoutTime', lockoutTime);
    
    loginButton.disabled = true;
    usernameInput.disabled = true;
    passwordInput.disabled = true;
    
    // Set timeout to unlock
    setTimeout(() => {
        unlockUser();
    }, CONFIG.lockoutDuration);
}

/**
 * Unlock user after lockout period
 */
function unlockUser() {
    isLocked = false;
    loginAttempts = 0;
    
    localStorage.removeItem('loginAttempts');
    localStorage.removeItem('lockoutTime');
    
    loginButton.disabled = false;
    usernameInput.disabled = false;
    passwordInput.disabled = false;
    
    clearError();
    focusUsername();
}

/**
 * Check if user is currently locked out
 */
function checkLockoutStatus() {
    const lockoutTime = localStorage.getItem('lockoutTime');
    
    if (lockoutTime) {
        const timeRemaining = parseInt(lockoutTime) - Date.now();
        
        if (timeRemaining > 0) {
            isLocked = true;
            loginButton.disabled = true;
            usernameInput.disabled = true;
            passwordInput.disabled = true;
            
            const minutesRemaining = Math.ceil(timeRemaining / 60000);
            showError(`Account locked. Try again in ${minutesRemaining} minute${minutesRemaining !== 1 ? 's' : ''}.`);
            
            // Set timeout to unlock
            setTimeout(() => {
                unlockUser();
            }, timeRemaining);
        } else {
            unlockUser();
        }
    } else {
        // Load previous attempt count
        const attempts = localStorage.getItem('loginAttempts');
        if (attempts) {
            loginAttempts = parseInt(attempts);
        }
    }
}

/**
 * Show error message
 */
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
}

/**
 * Clear error message
 */
function clearError() {
    errorMessage.style.display = 'none';
}

/**
 * Set loading state
 */
function setLoading(loading) {
    if (loading) {
        loginButton.classList.add('loading');
        loginButton.disabled = true;
    } else {
        loginButton.classList.remove('loading');
        loginButton.disabled = false;
    }
}

/**
 * Focus username input
 */
function focusUsername() {
    usernameInput.focus();
}

/**
 * Utility: Check if user is authenticated
 */
function isAuthenticated() {
    return sessionStorage.getItem('authToken') !== null;
}

/**
 * Utility: Logout user
 */
function logout() {
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('user');
    window.location.href = 'login.html';
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { isAuthenticated, logout };
}
