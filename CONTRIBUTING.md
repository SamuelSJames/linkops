# Contributing to LinkOps

Thank you for your interest in contributing to LinkOps! This document provides guidelines and information for contributors.

## 🚀 Getting Started

### Prerequisites

- Ubuntu 24.04 LTS (for backend development)
- Python 3.11+
- Git
- SSH keys for testing
- Basic knowledge of FastAPI, asyncio, and SSH

### Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/SamuelSJames/linkops.git
   cd linkops
   ```

2. **Set up Python environment**
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r backend/requirements.txt
   ```

3. **Review the specification**
   - Read `.kiro/specs/linkops-backend-api/requirements.md`
   - Read `.kiro/specs/linkops-backend-api/design.md`
   - Read `.kiro/specs/linkops-backend-api/tasks.md`

## 📋 Project Structure

```
linkops/
├── frontend/          # Complete (HTML, CSS, JS)
├── backend/           # In development (Python/FastAPI)
├── docs/              # Documentation
├── deployment/        # Deployment scripts
└── .kiro/specs/       # Complete specification
```

## 🎯 Current Focus

**Phase 1: User Onboarding (95% Complete)**
- ✅ User registration
- ✅ Git repository setup
- 🔄 Machine enrollment (frontend validation issue)

**Next Phase: Backend API Implementation**
- See `docs/IMPLEMENTATION_CHECKLIST.md` for detailed tasks
- 28 tasks organized in 7 phases
- Estimated: 98 hours (~12-13 working days)

## 🔧 Development Workflow

### For Backend Implementation

1. **Follow the specification exactly**
   - All requirements are defined in `.kiro/specs/linkops-backend-api/`
   - Each task has clear acceptance criteria
   - No architectural decisions needed

2. **Work sequentially through phases**
   - Phase 1: Project Setup and Authentication
   - Phase 2: Git Sync and Inventory Management
   - Phase 3: SSH Orchestration and Operations
   - Phase 4: Terminal Sessions and WebSocket
   - Phase 5: Table Queries and Health Monitoring
   - Phase 6: Configuration and Deployment
   - Phase 7: Testing and Documentation

3. **Write tests as you go**
   - Unit tests for all components
   - Property-based tests using Hypothesis (37 properties)
   - Integration tests for API endpoints
   - Target: 85%+ line coverage, 80%+ branch coverage

4. **Validate continuously**
   - Check acceptance criteria after each task
   - Run tests frequently
   - Deploy to test environment

### For Frontend Updates

The frontend is complete, but if you need to make changes:

1. Test in multiple browsers
2. Ensure responsive design is maintained
3. Follow existing code style (vanilla JS, no frameworks)
4. Update corresponding documentation

## 🧪 Testing

### Running Tests

```bash
# Unit tests
pytest tests/unit/

# Property-based tests
pytest tests/property/

# Integration tests
pytest tests/integration/

# All tests with coverage
pytest --cov=backend --cov-report=html
```

### Writing Tests

- **Unit tests**: Test individual components in isolation
- **Property tests**: Test universal properties (min 100 iterations)
- **Integration tests**: Test complete API workflows

Example property test:
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

## 📝 Code Style

### Python

- Follow PEP 8
- Use type hints
- Write docstrings for all functions
- Use async/await for I/O operations
- Handle errors gracefully

### JavaScript

- Use ES6+ features
- Follow existing code style
- Use meaningful variable names
- Comment complex logic

## 🔒 Security

### Important Rules

1. **Never commit secrets**
   - No API tokens, passwords, or SSH keys
   - Use `.gitignore` (already configured)
   - Store secrets in `secrets.ini` (excluded from Git)

2. **Follow enrollment-based security**
   - All operations require enrolled machines
   - Validate client IDs before execution
   - Never bypass security checks

3. **SSH key management**
   - Keys must have 600 permissions
   - Store in `/var/lib/linkops/keys/`
   - Never in Git repository

## 📚 Documentation

### When to Update Documentation

- Adding new API endpoints → Update `docs/API.md`
- Changing configuration → Update `docs/CONFIGURATION.md`
- Adding features → Update `README.md`
- Fixing bugs → Update `docs/TROUBLESHOOTING.md`

### Documentation Style

- Clear and concise
- Include code examples
- Use proper markdown formatting
- Keep it up-to-date

## 🐛 Bug Reports

When reporting bugs, include:

1. **Description**: What happened vs. what should happen
2. **Steps to reproduce**: Exact steps to trigger the bug
3. **Environment**: OS, Python version, etc.
4. **Logs**: Relevant error messages or logs
5. **Expected behavior**: What should have happened

## 💡 Feature Requests

Before requesting features:

1. Check if it's already in the specification
2. Check if it's in the roadmap (see `README.md`)
3. Explain the use case and benefit
4. Consider implementation complexity

## 🔄 Pull Request Process

1. **Create a branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Follow the specification
   - Write tests
   - Update documentation

3. **Test thoroughly**
   - All tests must pass
   - Coverage goals must be met
   - Manual testing completed

4. **Commit with clear messages**
   ```bash
   git commit -m "Add feature: brief description
   
   - Detailed change 1
   - Detailed change 2
   - Fixes #issue-number"
   ```

5. **Push and create PR**
   ```bash
   git push origin feature/your-feature-name
   ```
   - Create pull request on GitHub
   - Fill in PR template
   - Link related issues

6. **Code review**
   - Address review comments
   - Update as needed
   - Maintain clean commit history

## 📞 Getting Help

- **Documentation**: Check `docs/` directory
- **Specification**: See `.kiro/specs/linkops-backend-api/`
- **Issues**: Open a GitHub issue
- **Questions**: Contact project maintainers

## 🎯 Success Criteria

Your contribution is ready when:

- ✅ All acceptance criteria met
- ✅ All tests pass (unit, property, integration)
- ✅ Code coverage meets goals (85%+ line, 80%+ branch)
- ✅ Documentation updated
- ✅ Code follows style guidelines
- ✅ Security requirements met
- ✅ Manual testing completed

## 📜 License

By contributing to LinkOps, you agree that your contributions will be licensed under the same proprietary license as the project.

---

**Thank you for contributing to LinkOps!** 🚀

For questions or clarification, please open an issue or contact the maintainers.
