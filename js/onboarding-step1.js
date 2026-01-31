// LinkOps - Onboarding Step 1: User Registration
// JavaScript for user registration form with validation

document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const registrationForm = document.getElementById('registrationForm');
    const emailInput = document.getElementById('email');
    const usernameInput = document.getElementById('username');
    const firstNameInput = document.getElementById('firstName');
    const lastNameInput = document.getElementById('lastName');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const passwordToggle = document.getElementById('passwordToggle');
    const confirmPasswordToggle = document.getElementById('confirmPasswordToggle');
    const passwordStrength = document.getElementById('passwordStrength');
    const strengthFill = passwordStrength.querySelector('.strength-fill');
    const strengthText = passwordStrength.querySelector('.strength-text');

    // Error elements
    const emailError = document.getElementById('emailError');
    const usernameError = document.getElementById('usernameError');
    const firstNameError = document.getElementById('firstNameError');
    const passwordError = document.getElementById('passwordError');
    const confirmPasswordError = document.getElementById('confirmPasswordError');

    // Password visibility toggles
    passwordToggle.addEventListener('click', function() {
        const type = passwordInput.type === 'password' ? 'text' : 'password';
        passwordInput.type = type;
    });

    confirmPasswordToggle.addEventListener('click', function() {
        const type = confirmPasswordInput.type === 'password' ? 'text' : 'password';
        confirmPasswordInput.type = type;
    });

    // Password strength meter
    passwordInput.addEventListener('input', function() {
        const password = this.value;
        const strength = calculatePasswordStrength(password);
        
        strengthFill.className = 'strength-fill ' + strength.level;
        strengthText.textContent = strength.text;
        strengthText.style.color = strength.color;
    });

    function calculatePasswordStrength(password) {
        let score = 0;
        
        if (password.length >= 12) score++;
        if (password.length >= 16) score++;
        if (/[a-z]/.test(password)) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;
        
        if (score <= 2) {
            return { level: 'weak', text: 'Weak', color: '#f87171' };
        } else if (score <= 4) {
            return { level: 'medium', text: 'Medium', color: '#fbbf24' };
        } else {
            return { level: 'strong', text: 'Strong', color: '#4ade80' };
        }
    }

    // Real-time validation
    emailInput.addEventListener('blur', validateEmail);
    usernameInput.addEventListener('blur', validateUsername);
    firstNameInput.addEventListener('blur', validateFirstName);
    passwordInput.addEventListener('blur', validatePassword);
    confirmPasswordInput.addEventListener('blur', validateConfirmPassword);

    function validateEmail() {
        const email = emailInput.value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        if (!email) {
            showError(emailError, 'Email is required');
            return false;
        }
        
        if (!emailRegex.test(email)) {
            showError(emailError, 'Please enter a valid email address');
            return false;
        }
        
        hideError(emailError);
        return true;
    }

    function validateUsername() {
        const username = usernameInput.value.trim();
        const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
        
        if (!username) {
            showError(usernameError, 'Username is required');
            return false;
        }
        
        if (!usernameRegex.test(username)) {
            showError(usernameError, '3-20 characters, letters, numbers, dash, underscore only');
            return false;
        }
        
        hideError(usernameError);
        return true;
    }

    function validateFirstName() {
        const firstName = firstNameInput.value.trim();
        
        if (!firstName) {
            showError(firstNameError, 'First name is required');
            return false;
        }
        
        if (firstName.length < 2) {
            showError(firstNameError, 'First name must be at least 2 characters');
            return false;
        }
        
        hideError(firstNameError);
        return true;
    }

    function validatePassword() {
        const password = passwordInput.value;
        
        if (!password) {
            showError(passwordError, 'Password is required');
            return false;
        }
        
        if (password.length < 12) {
            showError(passwordError, 'Password must be at least 12 characters');
            return false;
        }
        
        if (!/[A-Z]/.test(password)) {
            showError(passwordError, 'Password must contain at least one uppercase letter');
            return false;
        }
        
        if (!/[a-z]/.test(password)) {
            showError(passwordError, 'Password must contain at least one lowercase letter');
            return false;
        }
        
        if (!/[0-9]/.test(password)) {
            showError(passwordError, 'Password must contain at least one number');
            return false;
        }
        
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            showError(passwordError, 'Password must contain at least one special character');
            return false;
        }
        
        hideError(passwordError);
        return true;
    }

    function validateConfirmPassword() {
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        
        if (!confirmPassword) {
            showError(confirmPasswordError, 'Please confirm your password');
            return false;
        }
        
        if (password !== confirmPassword) {
            showError(confirmPasswordError, 'Passwords do not match');
            return false;
        }
        
        hideError(confirmPasswordError);
        return true;
    }

    function showError(element, message) {
        element.textContent = message;
        element.classList.add('show');
    }

    function hideError(element) {
        element.textContent = '';
        element.classList.remove('show');
    }

    // Form submission
    registrationForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        // Validate all fields
        const isEmailValid = validateEmail();
        const isUsernameValid = validateUsername();
        const isFirstNameValid = validateFirstName();
        const isPasswordValid = validatePassword();
        const isConfirmPasswordValid = validateConfirmPassword();

        if (!isEmailValid || !isUsernameValid || !isFirstNameValid || !isPasswordValid || !isConfirmPasswordValid) {
            return;
        }

        // Prepare form data
        const formData = {
            email: emailInput.value.trim(),
            username: usernameInput.value.trim(),
            firstName: firstNameInput.value.trim(),
            lastName: lastNameInput.value.trim() || null,
            password: passwordInput.value
        };

        // Get submit button
        const submitButton = registrationForm.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.innerHTML;

        try {
            // Show loading state
            submitButton.disabled = true;
            submitButton.innerHTML = '<span class="button-text">Creating Account...</span>';

            // Call API
            const response = await fetch('/api/onboarding/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok) {
                // Store JWT token
                sessionStorage.setItem('linkops_token', data.token);
                sessionStorage.setItem('linkops_user_id', data.userId);
                sessionStorage.setItem('linkops_email', formData.email);

                // Redirect to step 2
                window.location.href = 'onboarding-step2.html';
            } else {
                // Show error message
                if (data.detail) {
                    if (data.detail.includes('email')) {
                        showError(emailError, data.detail);
                    } else if (data.detail.includes('username') || data.detail.includes('Username')) {
                        showError(usernameError, data.detail);
                    } else if (data.detail.includes('password') || data.detail.includes('Password')) {
                        showError(passwordError, data.detail);
                    } else {
                        alert('Registration failed: ' + data.detail);
                    }
                } else {
                    alert('Registration failed. Please try again.');
                }

                // Reset button
                submitButton.disabled = false;
                submitButton.innerHTML = originalButtonText;
            }
        } catch (error) {
            console.error('Registration error:', error);
            alert('Network error. Please check your connection and try again.');

            // Reset button
            submitButton.disabled = false;
            submitButton.innerHTML = originalButtonText;
        }
    });
});
