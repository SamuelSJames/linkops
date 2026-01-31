// LinkOps - Onboarding Step 3: Machine Enrollment
// JavaScript for enrolling the first machine

document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const enrollmentForm = document.getElementById('machineEnrollmentForm');
    const machineNameInput = document.getElementById('machineName');
    const sshUserInput = document.getElementById('sshUser');
    const sshPortInput = document.getElementById('sshPort');
    const descriptionInput = document.getElementById('description');
    const tagsInput = document.getElementById('tags');
    const useDefaultsBtn = document.getElementById('useDefaultsBtn');
    const enrollmentProgress = document.getElementById('enrollmentProgress');
    const completeBtn = document.getElementById('completeBtn');
    const backBtn = document.getElementById('backBtn');

    // Use defaults button
    useDefaultsBtn.addEventListener('click', function() {
        machineNameInput.value = 'linkops-server';
        sshUserInput.value = 'linkops-local';
        sshPortInput.value = '22';
        descriptionInput.value = 'LinkOps management server';
        tagsInput.value = 'prod, management, linkops';
    });

    // Back button
    backBtn.addEventListener('click', function() {
        window.location.href = 'onboarding-step2.html';
    });

    // Form submission
    enrollmentForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        // Validate inputs
        if (!validateForm()) {
            return;
        }

        // Prepare form data
        const formData = {
            machineName: machineNameInput.value.trim(),
            sshUser: sshUserInput.value.trim(),
            sshPort: parseInt(sshPortInput.value),
            description: descriptionInput.value.trim() || null,
            tags: tagsInput.value.trim() || null
        };

        // Show progress
        enrollmentProgress.style.display = 'block';
        completeBtn.disabled = true;
        backBtn.disabled = true;
        useDefaultsBtn.disabled = true;

        try {
            // Start enrollment process
            await enrollMachine(formData);
        } catch (error) {
            console.error('Enrollment error:', error);
            alert('Enrollment failed. Please try again.');
            enrollmentProgress.style.display = 'none';
            completeBtn.disabled = false;
            backBtn.disabled = false;
            useDefaultsBtn.disabled = false;
        }
    });

    // Validate form
    function validateForm() {
        let isValid = true;

        // Validate machine name
        const machineNamePattern = /^[a-z0-9-_]+$/;
        if (!machineNamePattern.test(machineNameInput.value)) {
            showError('machineNameError', 'Only lowercase letters, numbers, dash, and underscore allowed');
            isValid = false;
        }

        // Validate SSH user
        const sshUserPattern = /^[a-z_][a-z0-9_-]*$/;
        if (!sshUserPattern.test(sshUserInput.value)) {
            showError('sshUserError', 'Invalid username format');
            isValid = false;
        }

        // Validate SSH port
        const port = parseInt(sshPortInput.value);
        if (port < 1 || port > 65535) {
            showError('sshPortError', 'Port must be between 1 and 65535');
            isValid = false;
        }

        return isValid;
    }

    // Show error message
    function showError(elementId, message) {
        const errorElement = document.getElementById(elementId);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }
    }

    // Enroll machine
    async function enrollMachine(formData) {
        // Step 1: Creating SSH user
        updateProgress('step1', 'active');
        await sleep(500);

        // Step 2: Generating client ID
        updateProgress('step1', 'complete');
        updateProgress('step2', 'active');
        await sleep(500);

        // Step 3: Testing SSH connection
        updateProgress('step2', 'complete');
        updateProgress('step3', 'active');
        await sleep(500);

        // Step 4: Updating Git repository
        updateProgress('step3', 'complete');
        updateProgress('step4', 'active');

        // Call API
        const response = await fetch('/api/onboarding/machine/enroll-self', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (response.ok && data.success) {
            updateProgress('step4', 'complete');
            await sleep(500);

            // Store machine info for success page
            sessionStorage.setItem('clientId', data.clientId);
            sessionStorage.setItem('machineId', data.machineId);

            // Redirect to success page
            window.location.href = 'onboarding-success.html';
        } else {
            throw new Error(data.message || 'Enrollment failed');
        }
    }

    // Update progress step
    function updateProgress(stepId, state) {
        const step = document.getElementById(stepId);
        if (!step) return;

        step.classList.remove('active', 'complete', 'error');
        
        if (state === 'active') {
            step.classList.add('active');
            step.querySelector('.progress-spinner').style.display = 'block';
        } else if (state === 'complete') {
            step.classList.add('complete');
            step.querySelector('.progress-spinner').style.display = 'none';
            step.querySelector('.progress-spinner').textContent = '✓';
        } else if (state === 'error') {
            step.classList.add('error');
            step.querySelector('.progress-spinner').style.display = 'none';
            step.querySelector('.progress-spinner').textContent = '✗';
        }
    }

    // Sleep utility
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
});
