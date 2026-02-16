# EDMECA Academy Git Workflow

## Branch Structure

### 🌟 **main** - Production Branch
- **Purpose**: Production-ready code only
- **Protection**: Protected branch, requires PR reviews  
- **Deployment**: Auto-deploys to production via GitHub Actions
- **Rule**: Never commit directly to main

### 🔬 **staging** - Testing Branch  
- **Purpose**: Pre-production testing and QA
- **From**: Merges from development branch
- **Testing**: Full integration testing happens here
- **Deployment**: Can deploy to staging environment for client review

### 🛠️ **development** - Active Development
- **Purpose**: Daily development work and feature integration
- **From**: Branch off for features, merge back when complete
- **Testing**: Basic functionality testing
- **Active Branch**: Default working branch

## Workflow Process

### 1. Feature Development
```bash
# Start from development branch
git checkout development
git pull origin development

# Create feature branch
git checkout -b feature/new-feature-name

# Work on your feature
# ... make changes ...

# Commit and push
git add .
git commit -m "feat: add new feature description"
git push origin feature/new-feature-name
```

### 2. Integration to Staging
```bash
# Merge feature to development
git checkout development
git pull origin development
git merge feature/new-feature-name
git push origin development

# Merge development to staging for testing
git checkout staging
git pull origin staging
git merge development
git push origin staging
```

### 3. Production Release
```bash
# After staging approval, merge to main
git checkout main
git pull origin main
git merge staging
git push origin main
# Auto-deploys to production
```

## Repository Information
- **GitHub**: https://github.com/X4OConsulting/Edmeca-Academy-Website.git
- **Account**: khusselmann@x4o.co.za (KeenanHusselmannX4O)
- **Current Status**: ✅ All branches set up and synchronized

## Quick Commands
```bash
# Switch to development for new work
git checkout development

# Check current branch
git branch

# Pull latest changes
git pull origin <branch-name>

# View all branches
git branch -a
```

## Environment Setup
- **Local Development**: http://localhost:5173
- **Staging**: TBD (set up staging environment URL)
- **Production**: TBD (set up production environment URL)