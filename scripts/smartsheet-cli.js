#!/usr/bin/env node

/**
 * Smartsheet CLI Tool for EDMECA Academy
 * Update project tracker directly from terminal
 */

import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local', quiet: true });
dotenv.config({ quiet: true });

const execPromise = promisify(exec);

class SmartsheetCLI {
  constructor() {
    this.apiToken = process.env.SMARTSHEET_API_TOKEN;
    this.sheetId = process.env.SMARTSHEET_SHEET_ID;
    this.apiBase = 'https://api.smartsheet.com/2.0';
    
    console.log('🔧 Smartsheet Configuration:');
    console.log(`   API Token: ${this.apiToken ? 'Set (' + this.apiToken.substring(0, 10) + '...)' : 'Not Set'}`);
    console.log(`   Sheet ID: ${this.sheetId || 'Not Set'}`);
    
    if (!this.apiToken) {
      console.error('❌ SMARTSHEET_API_TOKEN environment variable not set');
      console.error('   Check your .env.local file');
      process.exit(1);
    }
    
    if (!this.sheetId) {
      console.error('❌ SMARTSHEET_SHEET_ID environment variable not set');
      console.error('   Check your .env.local file');
      process.exit(1);
    }
  }

  async request(method, endpoint, data = null) {
    try {
      console.log(`🔄 Making ${method} request to: ${endpoint}`);
      
      const config = {
        method,
        url: `${this.apiBase}${endpoint}`,
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10 second timeout
      };
      
      if (data) config.data = data;
      
      const response = await axios(config);
      console.log(`✅ Request successful`);
      return response.data;
    } catch (error) {
      console.error('❌ API Error Details:');
      console.error('Status:', error.response?.status);
      console.error('Message:', error.response?.data?.message || error.message);
      console.error('Endpoint:', endpoint);
      throw error;
    }
  }

  async getSheet() {
    return await this.request('GET', `/sheets/${this.sheetId}`);
  }

  async updateTaskStatus(taskId, status) {
    const sheet = await this.getSheet();
    
    // Find the row with matching Task ID
    // Convert taskId to number for comparison
    const numericTaskId = parseFloat(taskId);
    
    const row = sheet.rows.find(r => 
      r.cells.find(c => c.value === numericTaskId)
    );
    
    if (!row) {
      console.error(`❌ Task ${taskId} not found`);
      return;
    }

    // Find status column
    const statusColumn = sheet.columns.find(c => 
      c.title.toLowerCase().includes('status')
    );
    
    if (!statusColumn) {
      console.error('❌ Status column not found');
      return;
    }

    // Update the row
    const updateData = [
      {
        id: row.id,
        cells: [{
          columnId: statusColumn.id,
          value: status
        }]
      }
    ];

    await this.request('PUT', `/sheets/${this.sheetId}/rows`, updateData);
    console.log(`✅ Task ${taskId} status updated to: ${status}`);
  }

  async markTaskComplete(taskId) {
    await this.updateTaskStatus(taskId, 'Complete');
    
    // Also update % Complete to 100%
    const sheet = await this.getSheet();
    
    // Convert taskId to number for comparison
    const numericTaskId = parseFloat(taskId);
    
    const row = sheet.rows.find(r => 
      r.cells.find(c => c.value === numericTaskId)
    );
    
    const percentColumn = sheet.columns.find(c => 
      c.title.toLowerCase().includes('% complete')
    );
    
    if (row && percentColumn) {
      const updateData = [
        {
          id: row.id,
          cells: [{
            columnId: percentColumn.id,
            value: 1  // 100% as numeric value (1.0)
          }]
        }
      ];
      
      await this.request('PUT', `/sheets/${this.sheetId}/rows`, updateData);
      console.log(`✅ Task ${taskId} marked 100% complete`);
    }
  }

  async addTask(phase, title, description, priority = 'Medium') {
    const sheet = await this.getSheet();
    
    // Generate next task ID in sequence
    const taskIds = sheet.rows
      .map(r => r.cells.find(c => c.value?.toString().match(/^\d+(\.\d+)?$/)))
      .filter(Boolean)
      .map(c => c.value.toString())
      .sort();
    
    const nextId = this.generateNextTaskId(taskIds, phase);
    
    // Find column IDs
    const columnMap = {};
    sheet.columns.forEach(col => {
      const title = col.title.toLowerCase();
      if (title.includes('task id')) columnMap.taskId = col.id;
      if (title.includes('task name')) columnMap.name = col.id;
      if (title.includes('description')) columnMap.description = col.id;
      if (title.includes('priority')) columnMap.priority = col.id;
      if (title.includes('status')) columnMap.status = col.id;
      if (title.includes('sdlc phase')) columnMap.phase = col.id;
    });

    // Create new row
    const newRow = {
      cells: [
        { columnId: columnMap.taskId, value: parseFloat(nextId) }, // Convert to number
        { columnId: columnMap.name, value: title },
        { columnId: columnMap.description, value: description },
        { columnId: columnMap.priority, value: priority },
        { columnId: columnMap.status, value: 'Not Started' },
        { columnId: columnMap.phase, value: phase }
      ].filter(cell => cell.columnId) // Remove undefined columns
    };

    await this.request('POST', `/sheets/${this.sheetId}/rows`, { rows: [newRow] });
    console.log(`✅ Added task ${nextId}: ${title}`);
  }

  generateNextTaskId(existingIds, phase) {
    const phaseIds = existingIds.filter(id => id.startsWith(phase + '.'));
    if (phaseIds.length === 0) {
      return `${phase}.1`;
    }
    
    const maxSubId = Math.max(...phaseIds.map(id => 
      parseInt(id.split('.')[1])
    ));
    
    return `${phase}.${maxSubId + 1}`;
  }

  async syncGitCommits() {
    // Get recent git commits
    try {
      const { stdout } = await execPromise('git log --oneline -10');
      const commits = stdout.trim().split('\n');
      
      console.log('📋 Recent commits that could be tracked:');
      commits.forEach((commit, i) => {
        console.log(`${i + 1}. ${commit}`);
      });
      
      // Auto-detect completion patterns
      const completionPatterns = [
        /^(fix|feat|docs|style|refactor|test|chore):/,
        /complete|done|finish|implement/i
      ];
      
      for (const commit of commits) {
        if (completionPatterns.some(pattern => pattern.test(commit))) {
          console.log(`🎯 Potential completion: ${commit}`);
          // Could auto-update related tasks
        }
      }
      
    } catch (error) {
      console.error('❌ Error reading git commits:', error.message);
    }
  }

  async showHelp() {
    console.log(`
🛠️  EDMECA Academy Smartsheet CLI

📋 Commands:
  status <taskId>           - Update task status
  complete <taskId>         - Mark task as complete
  add <phase> <title>       - Add new task
  sync                      - Sync with git commits
  sheet                     - View sheet info

📝 Examples:
  node smartsheet-cli.js complete 1.1
  node smartsheet-cli.js status 2.3 "In Progress"
  node smartsheet-cli.js add 3 "Implement user authentication"
  node smartsheet-cli.js sync

🔧 Setup:
  export SMARTSHEET_API_TOKEN=your-token
  export SMARTSHEET_SHEET_ID=your-sheet-id
`);
  }
}

// CLI Interface
async function main() {
  const cli = new SmartsheetCLI();
  const [command, ...args] = process.argv.slice(2);

  switch (command) {
    case 'complete':
      console.log('🎯 Starting task completion...');
      if (!args[0]) {
        console.error('❌ Task ID required: complete <taskId>');
        return;
      }
      console.log(`🎯 Marking task ${args[0]} as complete...`);
      await cli.markTaskComplete(args[0]);
      console.log('✅ Task completion finished');
      break;
      
    case 'status':
      if (!args[0] || !args[1]) {
        console.error('❌ Usage: status <taskId> <status>');
        return;
      }
      await cli.updateTaskStatus(args[0], args[1]);
      break;
      
    case 'add':
      if (args.length < 2) {
        console.error('❌ Usage: add <phase> <title> [description]');
        return;
      }
      await cli.addTask(args[0], args[1], args[2] || '');
      break;
      
    case 'sync':
      await cli.syncGitCommits();
      break;
      
    case 'sheet':
      const sheet = await cli.getSheet();
      console.log(`📊 Sheet: ${sheet.name}`);
      console.log(`📝 Rows: ${sheet.totalRowCount}`);
      console.log(`📋 Columns: ${sheet.columns.length}`);
      break;
      
    default:
      await cli.showHelp();
  }
}

// Check if this file is being run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('❌ CLI Error:', error.message);
    console.error(error);
  });
}

export default SmartsheetCLI;