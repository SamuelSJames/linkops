"""
Script to update main.py to include Git onboarding router
"""

# Add this import after the other onboarding import:
# from api import git_onboarding

# Add this router after the onboarding router:
# app.include_router(git_onboarding.router, tags=["onboarding-git"])

print("Add these lines to /opt/linkops/backend/main.py:")
print()
print("1. After 'from api import onboarding', add:")
print("   from api import git_onboarding")
print()
print("2. After 'app.include_router(onboarding.router, tags=[\"onboarding\"])', add:")
print("   app.include_router(git_onboarding.router, tags=[\"onboarding-git\"])")
