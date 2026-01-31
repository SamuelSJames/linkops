#!/usr/bin/env python3
"""Update main.py to include onboarding router"""

# Read the file
with open('/opt/linkops/backend/main.py', 'r') as f:
    content = f.read()

# 1. Add onboarding import
if 'from api import onboarding' not in content:
    content = content.replace(
        'from api import auth, links, operations, git_api, tables, terminal',
        'from api import auth, links, operations, git_api, tables, terminal\nfrom api import onboarding'
    )

# 2. Add JWT secret initialization
if 'init_jwt_secret' not in content:
    content = content.replace(
        '        lockout_duration_minutes=config.lockout_duration_minutes\n    )',
        '        lockout_duration_minutes=config.lockout_duration_minutes\n    )\n\n    # Initialize onboarding JWT secret\n    from api.onboarding import init_jwt_secret\n    init_jwt_secret(config.jwt_secret)'
    )

# 3. Add onboarding router
if 'onboarding.router' not in content:
    content = content.replace(
        'app.include_router(auth.router, prefix="/api/auth", tags=["auth"])',
        'app.include_router(auth.router, prefix="/api/auth", tags=["auth"])\napp.include_router(onboarding.router, tags=["onboarding"])'
    )

# Write the file
with open('/opt/linkops/backend/main.py', 'w') as f:
    f.write(content)

print('✅ main.py updated successfully')
