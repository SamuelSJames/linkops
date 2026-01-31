// LinkOps - Onboarding Step 2: Git Setup
// JavaScript for Git provider selection and connection testing

document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const customSelect = document.getElementById('customSelect');
    const selectTrigger = customSelect.querySelector('.select-trigger');
    const selectOptions = document.getElementById('selectOptions');
    const gitProviderInput = document.getElementById('gitProvider');
    const providerUrlInput = document.getElementById('providerUrl');
    const providerUrlGroup = document.getElementById('providerUrlGroup');
    const accessTokenInput = document.getElementById('accessToken');
    const tokenToggle = document.getElementById('tokenToggle');
    const tokenHelpBtn = document.getElementById('tokenHelpBtn');
    const tokenHelp = document.getElementById('tokenHelp');
    const testConnectionBtn = document.getElementById('testConnectionBtn');
    const connectionStatus = document.getElementById('connectionStatus');
    const nextBtn = document.getElementById('nextBtn');
    const backBtn = document.getElementById('backBtn');
    const gitSetupForm = document.getElementById('gitSetupForm');

    // Provider configurations
    const providerConfig = {
        github: {
            icon: 'assets/logos/github-color-svgrepo-com.svg',
            url: 'https://github.com',
            readonly: true,
            tokenGuide: 'https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token'
        },
        gitlab: {
            icon: 'assets/logos/gitlab-svgrepo-com.svg',
            url: 'https://gitlab.com',
            readonly: false,
            tokenGuide: 'https://docs.gitlab.com/ee/user/profile/personal_access_tokens.html'
        },
        gitea: {
            icon: 'assets/logos/gitea.svg',
            url: 'https://',
            readonly: false,
            tokenGuide: 'https://docs.gitea.io/en-us/api-usage/#authentication'
        },
        forgejo: {
            icon: 'assets/logos/forgejo.svg',
            url: 'https://',
            readonly: false,
            tokenGuide: 'https://forgejo.org/docs/latest/user/api-usage/#authentication'
        }
    };

    // Handle provider selection
    // Toggle dropdown
    selectTrigger.addEventListener('click', function(e) {
        e.stopPropagation();
        customSelect.classList.toggle('open');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', function() {
        customSelect.classList.remove('open');
    });

    // Handle option selection
    const options = selectOptions.querySelectorAll('.select-option');
    options.forEach(option => {
        option.addEventListener('click', function(e) {
            e.stopPropagation();
            
            const value = this.dataset.value;
            const icon = this.dataset.icon;
            const text = this.querySelector('.option-text').textContent;
            
            // Update hidden input
            gitProviderInput.value = value;
            
            // Update trigger display
            selectTrigger.querySelector('.select-text').innerHTML = `
                <img src="${icon}" alt="${text}" class="select-icon">
                ${text}
            `;
            
            // Update selected state
            options.forEach(opt => opt.classList.remove('selected'));
            this.classList.add('selected');
            
            // Close dropdown
            customSelect.classList.remove('open');
            
            // Handle provider-specific configuration
            if (providerConfig[value]) {
                const config = providerConfig[value];
                
                // Update provider URL
                providerUrlInput.value = config.url;
                providerUrlInput.readOnly = config.readonly;
                
                // Update token guide link
                const tokenGuideLink = document.getElementById('tokenGuideLink');
                tokenGuideLink.href = config.tokenGuide;
                
                // Show/hide URL field based on provider
                if (config.readonly) {
                    providerUrlGroup.style.display = 'none';
                } else {
                    providerUrlGroup.style.display = 'flex';
                }
            }
            
            // Reset connection status
            connectionStatus.style.display = 'none';
            nextBtn.disabled = true;
        });
    });

    // Token visibility toggle
    tokenToggle.addEventListener('click', function() {
        const type = accessTokenInput.type === 'password' ? 'text' : 'password';
        accessTokenInput.type = type;
    });

    // Token help toggle
    tokenHelpBtn.addEventListener('click', function(e) {
        e.preventDefault();
        if (tokenHelp.style.display === 'none') {
            tokenHelp.style.display = 'block';
        } else {
            tokenHelp.style.display = 'none';
        }
    });

    // Test connection
    testConnectionBtn.addEventListener('click', async function() {
        const provider = gitProviderInput.value;
        const providerUrl = providerUrlInput.value;
        const token = accessTokenInput.value;
        const owner = document.getElementById('repoOwner').value;

        // Validation
        if (!provider || !token || !owner) {
            showConnectionStatus(false, 'Please fill in all required fields');
            return;
        }

        // Show loading state
        testConnectionBtn.disabled = true;
        testConnectionBtn.innerHTML = '<span class="button-icon">⏳</span><span class="button-text">Testing...</span>';

        try {
            // Call API to test connection
            const response = await fetch('/api/onboarding/git/test', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    provider,
                    providerUrl,
                    token,
                    owner
                })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                showConnectionStatus(true, `Connected successfully as ${data.userInfo.username}`);
                nextBtn.disabled = false;
            } else {
                showConnectionStatus(false, data.message || 'Connection failed');
                nextBtn.disabled = true;
            }
        } catch (error) {
            showConnectionStatus(false, 'Network error. Please try again.');
            nextBtn.disabled = true;
        } finally {
            // Reset button
            testConnectionBtn.disabled = false;
            testConnectionBtn.innerHTML = '<span class="button-icon">🔌</span><span class="button-text">Test Connection</span>';
        }
    });

    // Show connection status
    function showConnectionStatus(success, message) {
        connectionStatus.style.display = 'flex';
        connectionStatus.className = 'connection-status ' + (success ? 'success' : 'error');
        connectionStatus.querySelector('.status-text').textContent = message;
    }

    // Back button
    backBtn.addEventListener('click', function() {
        window.location.href = 'onboarding-step1.html';
    });

    // Form submission
    gitSetupForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const formData = {
            provider: gitProviderInput.value,
            providerUrl: providerUrlInput.value,
            token: accessTokenInput.value,
            owner: document.getElementById('repoOwner').value,
            repoName: document.getElementById('repoName').value,
            private: true // Always private
        };

        // Show loading state
        nextBtn.disabled = true;
        nextBtn.innerHTML = '<span class="button-text">Creating Repository...</span>';

        try {
            const response = await fetch('/api/onboarding/git/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok && data.success) {
                // Store repo info for success page
                sessionStorage.setItem('repoUrl', data.repoUrl);
                // Proceed to next step
                window.location.href = 'onboarding-step3.html';
            } else {
                showConnectionStatus(false, data.message || 'Failed to create repository');
                nextBtn.disabled = false;
                nextBtn.innerHTML = '<span class="button-text">Create Repository</span><span class="button-icon">→</span>';
            }
        } catch (error) {
            showConnectionStatus(false, 'Network error. Please try again.');
            nextBtn.disabled = false;
            nextBtn.innerHTML = '<span class="button-text">Create Repository</span><span class="button-icon">→</span>';
        }
    });
});
