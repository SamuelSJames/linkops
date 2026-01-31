# Quick Start Guide for Pippin AI

**Welcome to LinkOps!** This guide will help you get started quickly.

## 🎯 Your Mission

Help complete the LinkOps backend API implementation. The frontend is done, the specification is complete, and you just need to follow the tasks.

## 📚 Essential Reading (In Order)

1. **`PIPPIN_PROJECT_BRIEFING.md`** - Complete project overview (READ THIS FIRST!)
2. **`.kiro/specs/linkops-backend-api/requirements.md`** - What to build
3. **`.kiro/specs/linkops-backend-api/design.md`** - How to build it
4. **`.kiro/specs/linkops-backend-api/tasks.md`** - Order to build it

## 🚀 Quick Setup

```bash
# Clone the repository
git clone https://github.com/SamuelSJames/linkops.git
cd linkops

# Set up Python environment
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r backend/requirements.txt

# You're ready to start!
```

## 📋 Current Status

### ✅ What's Complete
- Frontend (100%)
- Specification (100%)
- Deployment scripts (100%)
- Phase 1 Onboarding (95%)

### 🔄 What's In Progress
- Phase 1 Step 3: Machine enrollment frontend validation issue

### ⏳ What's Next
- Backend API implementation (28 tasks, 7 phases)

## 🎯 Where to Start

### Option 1: Fix Current Issues (Quick Win)

**Issue #1: Login Password Problem**
- File: `backend/api/onboarding.py`
- User: samueljamesinc
- Problem: Password not working after registration
- Solution: Debug password hashing/verification

**Issue #2: Step 3 Frontend Validation**
- Files: `js/onboarding-step3.js`, `backend/api/machine_onboarding.py`
- Problem: Frontend sending incorrect data format (422 errors)
- Backend works via curl
- Solution: Compare frontend request to working curl request

### Option 2: Start Backend Implementation (Main Work)

Follow `docs/IMPLEMENTATION_CHECKLIST.md`:

**Phase 1: Project Setup and Authentication (9 hours)**
- Task 1.1: Initialize FastAPI project structure
- Task 1.2: Implement database schema
- Task 1.3: Implement JWT authentication

## 🧪 Testing Strategy

### Property-Based Testing (Important!)

This project uses Hypothesis for property-based testing. You need to implement 37 correctness properties.

Example:
```python
from hypothesis import given, settings, strategies as st

@settings(max_examples=100)
@given(username=st.text(), password=st.text())
async def test_property_1_jwt_token_generation(username, password):
    """
    Feature: linkops-backend-api, Property 1
    For any valid credentials, authenticating should return a JWT token
    that expires exactly 24 hours from issuance.
    """
    # Test implementation
```

### Coverage Goals
- Line coverage: 85%+
- Branch coverage: 80%+
- Property test coverage: 100%

## 🔑 Key Concepts

### 1. Enrollment-Based Security
- Target machines MUST have `/etc/linkops/client_id` file
- Client ID must match inventory
- No operations without enrollment

### 2. Git-Based Configuration
- Machine inventory: `links.yaml`
- Script catalog: `scripts.yaml`
- Auto-sync every 15 minutes

### 3. Multi-Pane Terminals
- WebSocket-based SSH sessions
- 4 layouts: single, grid2x2, grid1x3, grid2x1

### 4. Real-Time Monitoring
- Server-Sent Events (SSE) for live output
- Concurrent script execution
- Complete audit trail

## 📁 Important Files

### Specification
- `.kiro/specs/linkops-backend-api/requirements.md` - 65 acceptance criteria
- `.kiro/specs/linkops-backend-api/design.md` - Architecture, API, 37 properties
- `.kiro/specs/linkops-backend-api/tasks.md` - 28 implementation tasks

### Documentation
- `README.md` - Project overview
- `docs/PROJECT_STATUS.md` - Complete status report
- `docs/SESSION_SUMMARY_JAN29.md` - Latest development session
- `docs/IMPLEMENTATION_CHECKLIST.md` - Task tracking

### Current Code
- `backend/api/onboarding.py` - User registration (working)
- `backend/api/git_onboarding.py` - Git setup (working)
- `backend/api/machine_onboarding.py` - Machine enrollment (backend works)
- `backend/services/git_providers.py` - GitHub/GitLab/Gitea/Forgejo clients

### Frontend
- `js/onboarding-step1.js` - Registration form
- `js/onboarding-step2.js` - Git setup form
- `js/onboarding-step3.js` - Enrollment form (has validation issue)

## 🛠️ Development Commands

### Testing Backend Endpoints
```bash
# Test registration
curl -X POST http://10.0.1.107:8000/api/onboarding/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "firstName": "Test",
    "lastName": "User",
    "password": "SecurePass123!"
  }'

# Check database
ssh linkops "sqlite3 /var/lib/linkops/linkops.db 'SELECT * FROM users;'"
```

### Deploying Changes
```bash
# Copy backend files
scp backend/api/onboarding.py linkops:/opt/linkops/backend/api/

# Restart service
ssh linkops "systemctl restart linkopsd"

# Check logs
ssh linkops "journalctl -u linkopsd -f"
```

## 🎯 Success Criteria

Your work is complete when:
- ✅ All 65 acceptance criteria met
- ✅ All 37 property-based tests pass (100 iterations each)
- ✅ All integration tests pass
- ✅ Code coverage: 85%+ line, 80%+ branch
- ✅ Service deploys successfully
- ✅ Frontend integrates successfully
- ✅ All security requirements met

## 💡 Tips for Success

1. **Read the specification first** - Everything is documented
2. **Follow tasks sequentially** - They build on each other
3. **Write tests as you go** - Don't save testing for the end
4. **Validate continuously** - Check acceptance criteria after each task
5. **Ask questions** - If anything is unclear, ask!

## 🔒 Security Reminders

- Never commit secrets or SSH keys
- Validate enrollment before operations
- SSH keys must have 600 permissions
- Use JWT tokens with 24-hour expiration
- Implement account lockout (5 attempts)

## 📞 Getting Help

- **Specification unclear?** Check `.kiro/specs/linkops-backend-api/`
- **Need examples?** Look at existing code in `backend/api/`
- **Stuck on a task?** Review acceptance criteria in tasks.md
- **Testing questions?** See `docs/guides/AI_IMPLEMENTATION_GUIDE.md`

## 🚀 Let's Build!

You have everything you need:
- ✅ Complete specification
- ✅ Clear acceptance criteria
- ✅ Step-by-step tasks
- ✅ Example code
- ✅ Testing strategy
- ✅ Deployment scripts

Start with Phase 1, Task 1.1 and work your way through. You've got this! 💪

---

**Questions?** Open an issue or contact the maintainers.

**Ready to start?** Read `PIPPIN_PROJECT_BRIEFING.md` and dive in!
