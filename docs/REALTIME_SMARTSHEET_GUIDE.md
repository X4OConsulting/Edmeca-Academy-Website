# Real-time Smartsheet Integration - Setup Guide

## 🚀 Overview
This system provides **real-time, automatic updates** to your Smartsheet project tracker directly from VS Code - like `git push` but for project management!

## ⚡ Features
- **File Change Detection** - Auto-update tasks when you modify code
- **Git Commit Sync** - Mark tasks complete based on commit messages  
- **Code Markers** - Use comments to trigger task updates
- **Branch-based Updates** - Different behavior for main/staging/dev branches
- **VS Code Integration** - Status bar, commands, and notifications
- **Background Monitoring** - Continuous file watching

## 🛠️ Setup Instructions

### 1. Get Smartsheet API Credentials
```bash
# 1. Login to Smartsheet (https://app.smartsheet.com)
# 2. Account → Apps & Integrations → API Access
# 3. Generate new access token
# 4. Copy your EDMECA SDLC sheet ID from the URL
```

### 2. Environment Configuration
Add to your `.env` file:
```bash
# Smartsheet Integration
SMARTSHEET_API_TOKEN=your-api-token-here
SMARTSHEET_SHEET_ID=your-sheet-id-here
SMARTSHEET_AUTO_TRACK_COMMITS=true
```

### 3. Install Dependencies
```bash
npm install axios dotenv chokidar
```

### 4. Make Git Hooks Executable (macOS/Linux)
```bash
chmod +x .git/hooks/post-commit
chmod +x .git/hooks/post-receive
```

### 5. Start File Watcher
```bash
# Run in background
node scripts/smartsheet-watcher.js &

# Or add to package.json
npm run watch:smartsheet
```

## 🎯 Usage Examples

### Code Markers Method
Add comments in your code to trigger automatic updates:

```typescript
// Login.tsx
export function Login() {
  /* COMPLETE: 1.1 */  // ← This marks task 1.1 as complete
  
  const handleLogin = () => {
    // TODO: 2.1  // ← This marks task 2.1 as "In Progress"
  };
}
```

```html
<!-- In HTML/JSX -->
<!-- COMPLETE: 3.2 -->
<div>Marketing component finished</div>
```

```python
# For Python files
# TASK COMPLETE: 4.1
def test_authentication():
    pass
```

### Git Commit Method
Use structured commit messages:

```bash
# These will auto-complete tasks:
git commit -m "feat: implement user authentication (1.1)"
git commit -m "fix: resolve login redirect issue (1.2)" 
git commit -m "complete: dashboard layout (2.1)"

# These will mark as "In Progress":
git commit -m "wip: working on OAuth integration (1.3)"
git commit -m "chore: update dependencies for task 5.2"
```

### VS Code Commands
```bash
# Available commands (Ctrl+Shift+P):
> EDMECA: Push Changes to Smartsheet
> EDMECA: Mark Task Complete  
> EDMECA: Update Task Status
> EDMECA: Sync All Changes to Smartsheet
```

### Manual CLI Commands
```bash
# Mark specific tasks complete
npm run task:complete 1.1
npm run task:complete 2.3

# Update task status
npm run task:status 1.2 "In Progress"
npm run task:status 3.1 "Blocked"

# Add new tasks
npm run task:add 2 "Implement user profiles" "Add user profile management"

# Sync recent changes
npm run task:sync
```

## 🔄 Automatic Triggers

### File-based Triggers
| File Pattern | Auto Action | Task Updated |
|-------------|-------------|--------------|
| `Login.tsx` created/modified | Mark In Progress | 1.1 |
| `Dashboard.tsx` created/modified | Mark In Progress | 2.1 |
| `*.test.*` files created | Mark In Progress | 4.1 |
| `README.md` updated | Mark In Progress | 6.1 |
| `netlify.toml` updated | Mark In Progress | 5.1 |

### Git-based Triggers  
| Git Action | Auto Action | Example |
|------------|-------------|---------|
| Commit to `main` | Mark deployment complete | Task 5.1 |
| Commit to `staging` | Mark testing in progress | Task 4.2 |
| Push with "feat:" | Mark tasks complete | Any referenced task |
| Push with "wip:" | Mark tasks in progress | Any referenced task |

### Code Pattern Triggers
```typescript
// Auto-completion patterns:
/* COMPLETE: 1.1 */     // Task 1.1 → Complete
// COMPLETE: 2.3        // Task 2.3 → Complete  
<!-- COMPLETE: 3.1 -->  // Task 3.1 → Complete

// In-progress patterns:
/* TODO: 1.2 */         // Task 1.2 → In Progress
// TODO: 4.1            // Task 4.1 → In Progress
<!-- TODO: 2.2 -->      // Task 2.2 → In Progress
```

## 📊 Real-time Monitoring

### Status Bar Integration (VS Code)
- **Green Sync Icon** - Successfully synced
- **Orange Clock** - Sync in progress  
- **Red Alert** - Sync failed
- **Tooltip** - Shows last sync time

### File Watcher Output
```bash
👀 Starting EDMECA Smartsheet file watcher...
📊 Monitoring: ./client/src, ./server, ./shared, ./docs
🔗 Sheet ID: 4892837462...
✅ File watcher active - changes will auto-sync to Smartsheet

📝 File change: client/src/pages/Login.tsx
📋 Auto-updated task 1.1 to "In Progress" based on file change
🔄 Updated Smartsheet: Task 1.1 → In Progress

✅ Auto-completed task 1.1 from code marker
🔄 Updated Smartsheet: Task 1.1 → Complete
```

## 🎛️ Configuration Options

### Package.json Scripts
```json
{
  "scripts": {
    "watch:smartsheet": "node scripts/smartsheet-watcher.js",
    "task:complete": "node scripts/smartsheet-cli.js complete",
    "task:status": "node scripts/smartsheet-cli.js status",
    "task:add": "node scripts/smartsheet-cli.js add",
    "task:sync": "node scripts/smartsheet-cli.js sync",
    "task:help": "node scripts/smartsheet-cli.js"
  }
}
```

### VS Code Settings (settings.json)
```json
{
  "edmeca.smartsheet.apiToken": "",
  "edmeca.smartsheet.sheetId": "",
  "edmeca.smartsheet.autoSync": true,
  "edmeca.smartsheet.syncOnSave": true,
  "edmeca.smartsheet.syncOnCommit": true
}
```

## 🔐 Security Best Practices

```bash
# Store API tokens securely
echo "SMARTSHEET_API_TOKEN=your-token" >> .env.local

# Restrict token permissions in Smartsheet
# - Grant only "Edit" access to your specific sheet
# - Avoid "Admin" level tokens

# Use read-only tokens for display-only features
SMARTSHEET_READONLY_TOKEN=your-readonly-token
```

## 🚨 Troubleshooting

### Common Issues

**File watcher not starting:**
```bash
# Check dependencies
npm install axios dotenv

# Check environment variables
echo $SMARTSHEET_API_TOKEN
echo $SMARTSHEET_SHEET_ID

# Check permissions
chmod +x scripts/smartsheet-watcher.js
```

**Tasks not updating:**
```bash
# Test API connection
node scripts/smartsheet-cli.js sheet

# Check task ID format (must match sheet exactly)
# Correct: 1.1, 2.3, 4.2
# Wrong: 1-1, 2_3, task-4-2

# Verify file patterns
node scripts/smartsheet-watcher.js --debug
```

**Git hooks not working:**
```bash
# Make hooks executable
chmod +x .git/hooks/post-commit
chmod +x .git/hooks/post-receive

# Test hook manually
.git/hooks/post-commit
```

### Debug Mode
```bash
# Run with debug output
DEBUG=1 node scripts/smartsheet-watcher.js

# Test specific file
node scripts/smartsheet-cli.js complete 1.1 --debug
```

## 🎨 Customization

### Add Custom File Patterns
Edit `scripts/smartsheet-watcher.js`:
```javascript
this.taskMappings = {
  // Your custom patterns
  'UserProfile.tsx': '2.2',
  'api/auth': '1.0',
  'cypress/e2e': '4.3',
  'deployment/': '5.0'
};
```

### Custom Completion Patterns
```javascript
this.completionPatterns = [
  /\/\*\s*DONE:\s*(\d+\.?\d*)\s*\*\//gi,  // /* DONE: 1.1 */
  /\/\/\s*FINISHED:\s*(\d+\.?\d*)/gi,      // // FINISHED: 2.1
  /#\s*COMPLETED:\s*(\d+\.?\d*)/gi         // # COMPLETED: 3.1
];
```

## 📈 Workflow Integration

### Development Flow
```bash
1. Start file watcher: npm run watch:smartsheet
2. Work on feature (files auto-sync to "In Progress")
3. Add completion marker: /* COMPLETE: 1.1 */
4. Commit with task reference: git commit -m "feat: login system (1.1)"
5. Push to staging: git push origin staging
6. Deploy to production: git push origin main
   → All related tasks automatically updated in Smartsheet!
```

### Team Workflow
```bash
# Morning standup
npm run task:sync  # Sync overnight changes

# During development  
# File watcher handles automatic updates

# End of day
git commit -m "wip: progress on dashboard (2.1, 2.3)"
git push origin development
# → Tasks 2.1 and 2.3 marked "In Progress"
```

This system gives you **seamless, real-time project tracking** that stays in sync with your actual development work! 🚀