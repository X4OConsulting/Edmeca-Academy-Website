# Smartsheet Integration Setup

## Quick Setup

### 1. Get Smartsheet API Token
1. Login to [Smartsheet](https://app.smartsheet.com)
2. **Account** → **Apps & Integrations** → **API Access**
3. **Generate new access token**
4. Copy token and keep secure

### 2. Get Sheet ID
1. Open your EDMECA SDLC tracker sheet
2. **File** → **Properties** → Copy **Sheet ID**

### 3. Environment Setup
Add to your `.env` file:
```bash
# Smartsheet Integration
SMARTSHEET_API_TOKEN=your-api-token-here
SMARTSHEET_SHEET_ID=your-sheet-id-here
```

## Terminal Usage

### Install Dependencies
```bash
npm install axios dotenv
```

### Available Commands
```bash
# Make script executable
chmod +x scripts/smartsheet-cli.js

# Mark task complete
node scripts/smartsheet-cli.js complete 1.1

# Update task status  
node scripts/smartsheet-cli.js status 1.2 "In Progress"

# Add new task
node scripts/smartsheet-cli.js add 3 "Implement OAuth" "Add Google OAuth integration"

# Sync with git commits
node scripts/smartsheet-cli.js sync

# View sheet info
node scripts/smartsheet-cli.js sheet
```

### Package.json Scripts
Add these to your `package.json`:
```json
{
  "scripts": {
    "task:complete": "node scripts/smartsheet-cli.js complete",
    "task:status": "node scripts/smartsheet-cli.js status", 
    "task:add": "node scripts/smartsheet-cli.js add",
    "task:sync": "node scripts/smartsheet-cli.js sync"
  }
}
```

## Usage Examples

### Development Workflow Integration
```bash
# After completing a feature
git commit -m "feat: implement user authentication"
npm run task:complete 1.1

# When starting work
npm run task:status 1.2 "In Progress"

# Adding new requirements
npm run task:add 2 "Add password reset" "Implement forgot password flow"
```

### Git Hooks Integration
Create `.git/hooks/post-commit`:
```bash
#!/bin/bash
# Auto-sync completed tasks with git commits
node scripts/smartsheet-cli.js sync
```

## Web Application Integration

### React Component for Task Management
```typescript
// components/TaskManager.tsx
import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';

export function TaskManager() {
  const [taskId, setTaskId] = useState('');
  const [status, setStatus] = useState('');

  const updateTask = async () => {
    await fetch('/api/smartsheet/update-task', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskId, status })
    });
  };

  return (
    <div className="p-4 border rounded-lg">
      <h3>Update SDLC Tracker</h3>
      <Input 
        placeholder="Task ID (e.g. 1.1)"
        value={taskId}
        onChange={(e) => setTaskId(e.target.value)}
      />
      <Input 
        placeholder="Status"
        value={status} 
        onChange={(e) => setStatus(e.target.value)}
      />
      <Button onClick={updateTask}>Update Task</Button>
    </div>
  );
}
```

### API Endpoint
```typescript
// server/smartsheet-api.ts - Netlify Function
export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  const { taskId, status } = JSON.parse(event.body);
  
  // Use SmartsheetCLI class here
  const cli = new SmartsheetCLI();
  await cli.updateTaskStatus(taskId, status);
  
  return {
    statusCode: 200,
    body: JSON.stringify({ success: true })
  };
};
```

## Advanced Features

### Automated Task Tracking
- **Git commit analysis** - Auto-detect completed features
- **Deploy hooks** - Mark deployment tasks complete
- **Testing integration** - Update test completion status
- **PR triggers** - Create tasks from PR descriptions

### Reporting Integration
```bash
# Generate weekly reports
node scripts/smartsheet-cli.js report weekly

# Export completed tasks
node scripts/smartsheet-cli.js export completed
```

## Security Considerations

- ✅ **Environment variables** for API tokens
- ✅ **Read-only tokens** for display-only features  
- ✅ **Webhook validation** for incoming data
- ✅ **Rate limiting** to avoid API throttling

This gives you real-time, bidirectional sync between your development workflow and project management!