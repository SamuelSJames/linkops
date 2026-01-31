# Phase 1: User Onboarding & Initial Setup

**Goal:** Create a seamless onboarding experience where a new user can register, connect their Git provider, and enroll their first machine (the LinkOps server itself).

---

## Overview

Phase 1 consists of 3 main steps:
1. **User Registration** - Create account with email and password
2. **Git Repository Setup** - Connect to Git provider and create LinkOps config repo
3. **First Machine Enrollment** - Enroll the LinkOps server itself as first managed machine

---

## Step 1: User Registration

### UI/UX
- Clean, modern registration form
- Progress indicator: "Step 1 of 3"
- Real-time validation feedback

### Required Fields
- **Email** (mandatory)
  - Format validation (valid email)
  - Uniqueness check
  - Will be used for login
- **First Name** (mandatory)
  - Min 2 characters
- **Last Name** (optional but recommended)
  - Min 2 characters if provided
- **Username** (mandatory)
  - 3-20 characters
  - Alphanumeric + underscore/dash only
  - Uniqueness check
  - Alternative login method (email OR username)
- **Password** (mandatory)
  - Minimum 12 characters
  - Must contain:
    - At least 1 uppercase letter
    - At least 1 lowercase letter
    - At least 1 number
    - At least 1 special character
  - Real-time strength indicator
- **Confirm Password** (mandatory)
  - Must match password field

### Features
- Password visibility toggle (eye icon)
- Password strength meter (weak/medium/strong)
- Clear error messages for validation failures
- "Already have an account? Login" link

### Backend API
```
POST /api/auth/register
{
  "email": "user@example.com",
  "username": "johndoe",
  "firstName": "John",
  "lastName": "Doe",
  "password": "SecurePass123!"
}

Response 201:
{
  "userId": "uuid",
  "message": "Account created successfully",
  "token": "jwt-token"
}
```

### Database
- Create user record in `users` table
- Hash password with bcrypt
- Set `is_admin: true` for first user
- Set `onboarding_completed: false`

---

## Step 2: Git Repository Setup

### UI/UX
- Progress indicator: "Step 2 of 3"
- Clear instructions with examples
- Collapsible "Help" sections for each field

### Git Provider Selection
**Supported Providers:**
- GitHub (github.com)
- GitLab (gitlab.com or self-hosted)
- Gitea (self-hosted)
- Forgejo (self-hosted)

### Required Fields

#### 2.1 Git Provider Configuration
- **Provider Type** (dropdown)
  - GitHub
  - GitLab
  - Gitea
  - Forgejo
  
- **Provider URL** (text input)
  - Default values based on provider:
    - GitHub: `https://github.com` (read-only)
    - GitLab: `https://gitlab.com` (editable for self-hosted)
    - Gitea: `https://` (user enters full URL)
    - Forgejo: `https://` (user enters full URL)
  - Validation: Must be valid HTTPS URL

#### 2.2 Authentication
- **Personal Access Token** (password input, preferred method)
  - Show "How to create token" link for each provider
  - Token permissions guide (expandable):
    - **GitHub:** `repo` (Full control of private repositories)
    - **GitLab:** `api` (Full API access)
    - **Gitea/Forgejo:** `write:repository` (Create and write to repos)
  
#### 2.3 Repository Configuration
- **Repository Owner** (text input)
  - Username or organization name
  - Help text: "Your username or organization where repo will be created"
  - Example: `johndoe` or `my-company`
  
- **Repository Name** (text input)
  - Default: `linkops-config`
  - Validation: Valid repo name (alphanumeric, dash, underscore)
  - Help text: "Name for your LinkOps configuration repository"

- **Repository Visibility** (radio buttons)
  - ⚫ Private (default, recommended)
  - ⚪ Public (not recommended - contains infrastructure info)
  - Warning message if Public selected

#### 2.4 Test Connection
- **"Test Connection"** button
  - Validates token
  - Checks if repo name is available
  - Shows success/error message
  - Must succeed before "Next" button is enabled

### Features
- Token visibility toggle
- Copy token button (for testing)
- Real-time validation
- Clear error messages
- "Learn more" links for each provider

### Backend API

#### Test Connection
```
POST /api/onboarding/git/test
{
  "provider": "github",
  "providerUrl": "https://github.com",
  "token": "ghp_xxxxxxxxxxxx",
  "owner": "johndoe"
}

Response 200:
{
  "success": true,
  "message": "Connection successful",
  "userInfo": {
    "username": "johndoe",
    "email": "john@example.com"
  }
}
```

#### Create Repository
```
POST /api/onboarding/git/create
{
  "provider": "github",
  "providerUrl": "https://github.com",
  "token": "ghp_xxxxxxxxxxxx",
  "owner": "johndoe",
  "repoName": "linkops-config",
  "private": true
}

Response 201:
{
  "success": true,
  "repoUrl": "https://github.com/johndoe/linkops-config",
  "cloneUrl": "https://github.com/johndoe/linkops-config.git",
  "message": "Repository created successfully"
}
```

### Repository Structure Created
LinkOps creates the following files in the new repo:

**`links.yaml`**
```yaml
# LinkOps Machine Inventory
# Add your machines here

machines: []
```

**`scripts.yaml`**
```yaml
# LinkOps Script Catalog
# Add your automation scripts here

scripts: []
```

**`README.md`**
```markdown
# LinkOps Configuration Repository

This repository contains your LinkOps infrastructure configuration.

## Files

- `links.yaml` - Machine inventory (servers, VMs, containers)
- `scripts.yaml` - Automation script catalog

## Security

⚠️ **Keep this repository private!** It contains sensitive infrastructure information.

## Usage

LinkOps automatically syncs this repository every 15 minutes. Any changes you push will be reflected in LinkOps.

## Documentation

For more information, visit: https://docs.linkops.io
```

**`.gitignore`**
```
# Secrets and sensitive data
secrets.ini
*.key
*.pem
*.ppk
.env

# Logs
*.log

# OS files
.DS_Store
Thumbs.db
```

### Backend Process
1. Validate token and permissions
2. Create repository via Git provider API
3. Initialize local Git repo in `/var/lib/linkops/git-repo`
4. Create initial files (links.yaml, scripts.yaml, README.md, .gitignore)
5. Commit and push to remote
6. Save Git config to database
7. Update user `onboarding_step: 2`

### Database
- Save to `git_config` table:
  - provider
  - provider_url
  - token (encrypted)
  - owner
  - repo_name
  - repo_url
  - clone_url
  - last_sync

---

## Step 3: First Machine Enrollment (Self)

### UI/UX
- Progress indicator: "Step 3 of 3"
- Explanation: "Let's add this LinkOps server as your first managed machine"
- Auto-filled fields where possible

### Process Overview
1. Create local non-root user for SSH
2. Generate client ID
3. Install client ID on local machine
4. Add machine to links.yaml
5. Test SSH connection
6. Verify enrollment
7. Commit and push to Git

### Required Fields

#### 3.1 Machine Information
- **Machine Name** (text input)
  - Default: `linkops-server`
  - Validation: lowercase, alphanumeric, dash, underscore
  - Help text: "Friendly name for this machine"

- **SSH User** (text input)
  - Default: `linkops-local`
  - Help text: "Non-root user for SSH connections"
  - LinkOps will create this user automatically

- **SSH Port** (number input)
  - Default: `22`
  - Validation: 1-65535

#### 3.2 Machine Details (Optional)
- **Description** (textarea)
  - Default: "LinkOps management server"
  - Help text: "Brief description of this machine's purpose"

- **Tags** (multi-select or comma-separated)
  - Suggested tags: `prod`, `management`, `linkops`
  - Help text: "Tags for organizing and filtering machines"

### Features
- "Use defaults" button (fills all fields with recommended values)
- Real-time validation
- Progress indicator during enrollment
- Clear success/error messages

### Backend API

#### Start Enrollment
```
POST /api/onboarding/machine/enroll-self
{
  "machineName": "linkops-server",
  "sshUser": "linkops-local",
  "sshPort": 22,
  "description": "LinkOps management server",
  "tags": ["prod", "management", "linkops"]
}

Response 200:
{
  "success": true,
  "clientId": "LINKOPS-a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "machineId": "linkops-server",
  "message": "Machine enrolled successfully"
}
```

### Backend Process

#### 3.1 Create Local User
```bash
# Create user
sudo useradd -m -s /bin/bash linkops-local

# Set password (random, secure)
sudo passwd linkops-local

# Add to sudo group (optional, for future management)
# sudo usermod -aG sudo linkops-local

# Create .ssh directory
sudo mkdir -p /home/linkops-local/.ssh
sudo chmod 700 /home/linkops-local/.ssh

# Copy authorized_keys from root or generate new key
sudo cp /root/.ssh/authorized_keys /home/linkops-local/.ssh/
sudo chown -R linkops-local:linkops-local /home/linkops-local/.ssh
sudo chmod 600 /home/linkops-local/.ssh/authorized_keys
```

#### 3.2 Generate and Install Client ID
```bash
# Generate UUID-based client ID
CLIENT_ID="LINKOPS-$(uuidgen)"

# Install client ID
sudo mkdir -p /etc/linkops
echo "$CLIENT_ID" | sudo tee /etc/linkops/client_id
sudo chmod 644 /etc/linkops/client_id
```

#### 3.3 Add to links.yaml
```yaml
machines:
  linkops-server:
    type: VM
    provider: Ubuntu
    host: 127.0.0.1
    port: 22
    user: linkops-local
    tags:
      - prod
      - management
      - linkops
    enrollment:
      required: true
      clientId: LINKOPS-a1b2c3d4-e5f6-7890-abcd-ef1234567890
    ssh:
      keyRef: linkops_default
      proxyJump: null
    metadata:
      os: Ubuntu 24.04 LTS
      description: LinkOps management server
      icon: assets/logos/ubuntu-linux.svg
```

#### 3.4 Test SSH Connection
```bash
# Test connection as new user
ssh -i /var/lib/linkops/keys/linkops_default linkops-local@127.0.0.1 "echo 'SSH OK'"
```

#### 3.5 Verify Enrollment
```bash
# Check client ID exists and matches
ssh -i /var/lib/linkops/keys/linkops_default linkops-local@127.0.0.1 "cat /etc/linkops/client_id"
```

#### 3.6 Commit and Push
```bash
cd /var/lib/linkops/git-repo
git add links.yaml
git commit -m "Add linkops-server to inventory"
git push origin main
```

### Database
- Create machine record in `machines` table
- Set `enrolled: true`
- Set `last_verified: now()`
- Update user `onboarding_completed: true`

---

## Completion

### Success Screen
- ✅ Congratulations message
- Summary of what was set up:
  - User account created
  - Git repository: `https://github.com/johndoe/linkops-config`
  - First machine enrolled: `linkops-server`
- **"Go to Dashboard"** button

### Post-Onboarding
- Redirect to Overview tab
- Show welcome tooltip/tour (optional)
- Display first machine in Links tab
- Enable all features

---

## Error Handling

### User Registration Errors
- Email already exists → "This email is already registered. Please login."
- Username taken → "Username not available. Try another."
- Weak password → Show specific requirements not met
- Network error → "Unable to connect. Please try again."

### Git Setup Errors
- Invalid token → "Invalid token. Please check your token and try again."
- Insufficient permissions → "Token doesn't have required permissions. See guide above."
- Repository already exists → "Repository name already exists. Choose another name."
- Network error → "Unable to connect to Git provider. Check URL and try again."

### Machine Enrollment Errors
- User creation failed → "Unable to create SSH user. Check system permissions."
- SSH connection failed → "Unable to connect via SSH. Check SSH service status."
- Client ID installation failed → "Unable to install client ID. Check file permissions."
- Git push failed → "Unable to push to repository. Check token permissions."

---

## Security Considerations

### Passwords
- Minimum 12 characters enforced
- Complexity requirements enforced
- Hashed with bcrypt (cost factor 12)
- Never logged or displayed

### Git Tokens
- Stored encrypted in database (AES-256)
- Never logged or displayed after initial entry
- Validated before storage
- Minimum required permissions documented

### SSH Keys
- Stored with 600 permissions
- Never committed to Git
- Separate key for Git operations vs machine SSH

### Client IDs
- UUID-based (cryptographically random)
- Stored in /etc/linkops/ (root-owned)
- Validated on every operation

---

## UI/UX Mockup Structure

### Registration Page
```
┌─────────────────────────────────────────┐
│  LinkOps                                │
│  ═══════                                │
│                                         │
│  Create Your Account                    │
│  Step 1 of 3                            │
│                                         │
│  Email *                                │
│  [____________________________]         │
│                                         │
│  Username *                             │
│  [____________________________]         │
│                                         │
│  First Name *                           │
│  [____________________________]         │
│                                         │
│  Last Name                              │
│  [____________________________]         │
│                                         │
│  Password *                             │
│  [____________________________] 👁      │
│  ████████░░░░ Strong                    │
│                                         │
│  Confirm Password *                     │
│  [____________________________] 👁      │
│                                         │
│  [        Create Account        ]       │
│                                         │
│  Already have an account? Login         │
└─────────────────────────────────────────┘
```

### Git Setup Page
```
┌─────────────────────────────────────────┐
│  LinkOps                                │
│  ═══════                                │
│                                         │
│  Connect Your Git Provider              │
│  Step 2 of 3                            │
│                                         │
│  Git Provider *                         │
│  [▼ GitHub        ]                     │
│                                         │
│  Provider URL                           │
│  [https://github.com____________]       │
│                                         │
│  Personal Access Token * 👁             │
│  [____________________________]         │
│  ℹ️ How to create a token               │
│                                         │
│  Repository Owner *                     │
│  [____________________________]         │
│  Your username or organization          │
│                                         │
│  Repository Name *                      │
│  [linkops-config______________]         │
│                                         │
│  Visibility                             │
│  ⚫ Private (recommended)                │
│  ⚪ Public                               │
│                                         │
│  [   Test Connection   ]                │
│                                         │
│  [  ← Back  ]  [     Next →     ]      │
└─────────────────────────────────────────┘
```

### Machine Enrollment Page
```
┌─────────────────────────────────────────┐
│  LinkOps                                │
│  ═══════                                │
│                                         │
│  Enroll Your First Machine              │
│  Step 3 of 3                            │
│                                         │
│  Let's add this LinkOps server as       │
│  your first managed machine.            │
│                                         │
│  Machine Name *                         │
│  [linkops-server______________]         │
│                                         │
│  SSH User *                             │
│  [linkops-local_______________]         │
│  Non-root user for SSH access           │
│                                         │
│  SSH Port *                             │
│  [22___]                                │
│                                         │
│  Description                            │
│  [LinkOps management server___]         │
│  [____________________________]         │
│                                         │
│  Tags                                   │
│  [prod, management, linkops___]         │
│                                         │
│  [    Use Defaults    ]                 │
│                                         │
│  [  ← Back  ]  [  Complete Setup  ]    │
└─────────────────────────────────────────┘
```

### Success Page
```
┌─────────────────────────────────────────┐
│  LinkOps                                │
│  ═══════                                │
│                                         │
│         🎉 Setup Complete!              │
│                                         │
│  Your LinkOps instance is ready!        │
│                                         │
│  ✓ Account created                      │
│  ✓ Git repository connected             │
│    github.com/johndoe/linkops-config    │
│  ✓ First machine enrolled               │
│    linkops-server                       │
│                                         │
│  [    Go to Dashboard    ]              │
└─────────────────────────────────────────┘
```

---

## Testing Checklist

### User Registration
- [ ] Valid registration succeeds
- [ ] Duplicate email rejected
- [ ] Duplicate username rejected
- [ ] Weak password rejected
- [ ] Password mismatch rejected
- [ ] Empty fields rejected
- [ ] Invalid email format rejected
- [ ] First user becomes admin
- [ ] JWT token generated and returned

### Git Setup
- [ ] GitHub connection works
- [ ] GitLab connection works
- [ ] Gitea connection works
- [ ] Forgejo connection works
- [ ] Invalid token rejected
- [ ] Invalid URL rejected
- [ ] Repository created successfully
- [ ] Initial files committed
- [ ] Private repo created by default
- [ ] Token stored encrypted

### Machine Enrollment
- [ ] Local user created
- [ ] Client ID generated and installed
- [ ] Machine added to links.yaml
- [ ] SSH connection successful
- [ ] Enrollment verified
- [ ] Changes pushed to Git
- [ ] Machine appears in database
- [ ] Onboarding marked complete

---

## API Endpoints Summary

```
POST /api/auth/register
POST /api/onboarding/git/test
POST /api/onboarding/git/create
POST /api/onboarding/machine/enroll-self
GET  /api/onboarding/status
```

---

## Database Schema Updates

### users table
```sql
ALTER TABLE users ADD COLUMN onboarding_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN onboarding_step INTEGER DEFAULT 0;
```

### git_config table (new)
```sql
CREATE TABLE git_config (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  provider VARCHAR(50) NOT NULL,
  provider_url VARCHAR(255) NOT NULL,
  token_encrypted TEXT NOT NULL,
  owner VARCHAR(255) NOT NULL,
  repo_name VARCHAR(255) NOT NULL,
  repo_url VARCHAR(255) NOT NULL,
  clone_url VARCHAR(255) NOT NULL,
  last_sync TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

---

## Next Steps (Phase 2)

Phase 2 will focus on:
- Adding additional machines (remote servers)
- Bulk machine enrollment
- Machine groups and organization
- Advanced SSH configurations (jump hosts, proxies)

---

**Document Version:** 1.0  
**Last Updated:** January 29, 2026  
**Status:** Ready for Implementation
