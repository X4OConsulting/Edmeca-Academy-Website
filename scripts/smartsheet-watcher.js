#!/usr/bin/env node

/**
 * EDMECA Academy - Real-time File Watcher for Smartsheet Integration
 * Monitors file changes and automatically updates project tracker
 */

import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local', quiet: true });
dotenv.config({ quiet: true });

const execPromise = promisify(exec);

class SmartsheetFileWatcher {
  constructor() {
    this.apiToken = process.env.SMARTSHEET_API_TOKEN;
    this.sheetId = process.env.SMARTSHEET_SHEET_ID;
    this.watchedPaths = [
      './client/src',
      './server',
      './shared',
      './docs'
    ];
    
    // Task ID mappings based on file patterns
    this.taskMappings = {
      // Authentication related files
      'Login.tsx': '1.1',
      'Auth': '1.0',
      'authentication': '1.0',
      
      // Dashboard and portal
      'Dashboard.tsx': '2.1',
      'portal': '2.0',
      
      // UI Components
      'components/ui': '3.1',
      'components/marketing': '3.2',
      
      // Testing files
      '.test.': '4.1',
      '.spec.': '4.1',
      'cypress': '4.2',
      
      // Deployment files
      'netlify.toml': '5.1',
      'package.json': '5.2',
      '.github/workflows': '5.3',
      
      // Documentation
      'README.md': '6.1',
      'docs/': '6.0'
    };
    
    this.completionPatterns = [
      /\/\*\s*COMPLETE:\s*(\d+\.?\d*)\s*\*\//gi,
      /\/\/\s*TASK\s*COMPLETE:\s*(\d+\.?\d*)/gi,
      /<!--\s*COMPLETE:\s*(\d+\.?\d*)\s*-->/gi,
      /#\s*COMPLETE:\s*(\d+\.?\d*)/gi
    ];
    
    this.inProgressPatterns = [
      /\/\*\s*TODO:\s*(\d+\.?\d*)\s*\*\//gi,
      /\/\/\s*TODO:\s*(\d+\.?\d*)/gi,
      /<!--\s*TODO:\s*(\d+\.?\d*)\s*-->/gi,
      /#\s*TODO:\s*(\d+\.?\d*)/gi
    ];
  }

  start() {
    if (!this.apiToken || !this.sheetId) {
      console.log('⚠️  Smartsheet configuration missing - file watcher disabled');
      return;
    }

    console.log('👀 Starting EDMECA Smartsheet file watcher...');
    console.log(`📊 Monitoring: ${this.watchedPaths.join(', ')}`);
    console.log(`🔗 Sheet ID: ${this.sheetId.substring(0, 10)}...`);
    
    this.watchedPaths.forEach(watchPath => {
      if (fs.existsSync(watchPath)) {
        this.watchDirectory(watchPath);
      }
    });

    // Also watch for git changes
    this.watchGitChanges();
    
    console.log('✅ File watcher active - changes will auto-sync to Smartsheet');
  }

  watchDirectory(dirPath) {
    fs.watch(dirPath, { recursive: true }, (eventType, filename) => {
      if (!filename) return;
      
      const fullPath = path.join(dirPath, filename);
      
      // Filter relevant files
      if (this.shouldWatchFile(filename)) {
        console.log(`📝 File ${eventType}: ${filename}`);
        
        setTimeout(() => {
          this.handleFileChange(fullPath, filename, eventType);
        }, 500); // Debounce rapid changes
      }
    });
  }

  shouldWatchFile(filename) {
    const watched = ['.ts', '.tsx', '.js', '.jsx', '.md', '.json', '.yml', '.yaml'];
    const ignored = ['node_modules', '.git', 'dist', 'build', '.next'];
    
    return watched.some(ext => filename.endsWith(ext)) && 
           !ignored.some(ignore => filename.includes(ignore));
  }

  async handleFileChange(filePath, filename, eventType) {
    try {
      // Check if file still exists (might be deleted)
      if (!fs.existsSync(filePath)) {
        return;
      }

      // Read file content
      const content = fs.readFileSync(filePath, 'utf8');
      
      // 1. Check for task completion markers
      await this.checkCompletionMarkers(content);
      
      // 2. Check for TODO markers (in progress tasks)  
      await this.checkInProgressMarkers(content);
      
      // 3. Auto-detect task based on file patterns
      const taskId = this.detectTaskFromFile(filename, filePath);
      if (taskId && eventType === 'change') {
        await this.updateTaskStatus(taskId, 'In Progress');
        console.log(`📋 Auto-updated task ${taskId} to "In Progress" based on file change`);
      }
      
      // 4. Special handling for new files
      if (eventType === 'rename' && fs.existsSync(filePath)) {
        await this.handleNewFile(filePath, filename);
      }
      
    } catch (error) {
      console.error(`❌ Error processing file ${filename}:`, error.message);
    }
  }

  async checkCompletionMarkers(content) {
    for (const pattern of this.completionPatterns) {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        const taskId = match[1];
        await this.markTaskComplete(taskId);
        console.log(`✅ Auto-completed task ${taskId} from code marker`);
      }
    }
  }

  async checkInProgressMarkers(content) {
    for (const pattern of this.inProgressPatterns) {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        const taskId = match[1];
        await this.updateTaskStatus(taskId, 'In Progress');
        console.log(`📝 Auto-updated task ${taskId} to "In Progress" from TODO marker`);
      }
    }
  }

  detectTaskFromFile(filename, fullPath) {
    for (const [pattern, taskId] of Object.entries(this.taskMappings)) {
      if (filename.includes(pattern) || fullPath.includes(pattern)) {
        return taskId;
      }
    }
    return null;
  }

  async handleNewFile(filePath, filename) {
    // Auto-detect what type of file was created and start appropriate tasks
    const newFilePatterns = {
      'Login.tsx': { taskId: '1.1', message: '🔐 Login component created' },
      'Dashboard.tsx': { taskId: '2.1', message: '📊 Dashboard component created' },
      '.test.': { taskId: '4.1', message: '🧪 Test file added' },
      'README.md': { taskId: '6.1', message: '📖 Documentation updated' }
    };

    for (const [pattern, config] of Object.entries(newFilePatterns)) {
      if (filename.includes(pattern)) {
        await this.updateTaskStatus(config.taskId, 'In Progress');
        console.log(config.message);
        break;
      }
    }
  }

  watchGitChanges() {
    // Watch for git ref changes (commits, pushes, etc.)
    const gitDir = '.git/refs/heads';
    if (!fs.existsSync(gitDir)) return;

    fs.watch(gitDir, { recursive: true }, (eventType, filename) => {
      if (filename) {
        console.log(`🔄 Git branch ${filename} updated`);
        setTimeout(() => this.handleBranchUpdate(filename), 1000);
      }
    });

    // Watch for commit messages
    const commitMsgFile = '.git/COMMIT_EDITMSG';
    if (fs.existsSync(commitMsgFile)) {
      fs.watchFile(commitMsgFile, (curr, prev) => {
        if (curr.mtime > prev.mtime) {
          setTimeout(() => this.handleCommitMessage(), 500);
        }
      });
    }
  }

  async handleBranchUpdate(branchName) {
    // Auto-update tasks based on branch activity
    const branchTaskMapping = {
      'main': '5.1', // Production deployment
      'staging': '4.2', // Staging deployment  
      'development': '3.0' // Development work
    };

    const taskId = branchTaskMapping[branchName];
    if (taskId) {
      await this.updateTaskStatus(taskId, 'In Progress');
      console.log(`🌿 Branch ${branchName} updated - task ${taskId} marked in progress`);
    }
  }

  async handleCommitMessage() {
    try {
      const commitMsg = fs.readFileSync('.git/COMMIT_EDITMSG', 'utf8').trim();
      if (!commitMsg) return;

      console.log(`📝 Processing commit: ${commitMsg.substring(0, 50)}...`);

      // Extract task IDs from commit message  
      const taskIds = commitMsg.match(/\b\d+\.?\d*\b/g) || [];
      
      for (const taskId of taskIds) {
        // Check if this is a completion commit
        if (/^(feat|fix|complete|implement|finish|done)/i.test(commitMsg)) {
          await this.markTaskComplete(taskId);
          console.log(`✅ Commit auto-completed task ${taskId}`);
        } else {
          await this.updateTaskStatus(taskId, 'In Progress');
          console.log(`📋 Commit updated task ${taskId} to in progress`);
        }
      }
    } catch (error) {
      console.error('Error processing commit message:', error.message);
    }
  }

  async markTaskComplete(taskId) {
    await this.updateTaskStatus(taskId, 'Complete', 100);
  }

  async updateTaskStatus(taskId, status, percentComplete = null) {
    try {
      // Get sheet data
      const sheetResponse = await axios.get(
        `https://api.smartsheet.com/2.0/sheets/${this.sheetId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const sheet = sheetResponse.data;
      
      // Find the row
      const row = sheet.rows.find(r => 
        r.cells.find(c => c.value === taskId)
      );

      if (!row) {
        console.log(`⚠️  Task ${taskId} not found in sheet`);
        return;
      }

      // Find columns
      const statusColumn = sheet.columns.find(c => 
        c.title.toLowerCase().includes('status')
      );
      const percentColumn = sheet.columns.find(c => 
        c.title.toLowerCase().includes('% complete')
      );

      // Build update
      const cells = [];
      
      if (statusColumn) {
        cells.push({
          columnId: statusColumn.id,
          value: status
        });
      }

      if (percentColumn && percentComplete !== null) {
        cells.push({
          columnId: percentColumn.id,
          value: `${percentComplete}%`
        });
      }

      if (cells.length === 0) return;

      // Send update
      await axios.put(
        `https://api.smartsheet.com/2.0/sheets/${this.sheetId}/rows`,
        {
          rows: [{
            id: row.id,
            cells
          }]
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log(`🔄 Updated Smartsheet: Task ${taskId} → ${status}`);
      
    } catch (error) {
      console.error(`❌ Smartsheet update failed for task ${taskId}:`, 
        error.response?.data?.message || error.message);
    }
  }
}

// CLI Usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const watcher = new SmartsheetFileWatcher();
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down file watcher...');
    process.exit(0);
  });

  watcher.start();
}

export default SmartsheetFileWatcher;