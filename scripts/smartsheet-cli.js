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
        timeout: 30000 // 30 second timeout
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

  async addTask(taskId, title, category = 'Feature Development', priority = 'Medium', description = '', status = 'Complete', risk = 'Medium') {
    // Hardcoded column IDs for EdMeCa Academy Website Development sheet (1413139749883780)
    // NOTE: "Assigned To" column (8030198556217220) is CONTACT type — omit to avoid API 400 errors.
    const COL = {
      taskId:   148899208318852,
      name:     4652498835689348,
      phase:    2400699022004100,
      category: 6904298649374596,
      priority: 1274799115161476,
      status:   5778398742531972,
      pct:      3526598928846724,
      desc:     1837749068582788,
      risk:     2682173998714756,
    };

    // Derive SDLC phase label from task ID (e.g. "3.18" → "3 - Development")
    const phaseLabels = {
      '1': '1 - Planning',
      '2': '2 - Design',
      '3': '3 - Development',
      '4': '4 - Testing',
      '5': '5 - Deployment',
      '6': '6 - Documentation',
      '7': '7 - Maintenance',
    };
    const phaseKey = String(taskId).split('.')[0];
    const phaseLabel = phaseLabels[phaseKey] || phaseKey;

    // Find the preceding task row to use as siblingId (inserts directly below it)
    const sheet = await this.getSheet();
    const [major, minor] = String(taskId).split('.').map(Number);

    // Walk backwards from minor-1 down to 1 to find the closest existing predecessor
    let siblingId = null;
    for (let prev = minor - 1; prev >= 1; prev--) {
      const prevTaskId = `${major}.${prev}`;
      const siblingRow = sheet.rows.find(r =>
        r.cells.find(c => c.columnId === COL.taskId && String(c.value) === prevTaskId)
      );
      if (siblingRow) {
        siblingId = siblingRow.id;
        console.log(`📌 Inserting after task ${prevTaskId} (row ${siblingId})`);
        break;
      }
    }

    const newRow = {
      ...(siblingId ? { siblingId } : { toBottom: true }),
      cells: [
        { columnId: COL.taskId,   value: taskId },
        { columnId: COL.name,     value: title },
        { columnId: COL.phase,    value: phaseLabel },
        { columnId: COL.category, value: category },
        { columnId: COL.priority, value: priority },
        { columnId: COL.status,   value: status },
        { columnId: COL.pct,      value: status === 'Complete' ? 1 : 0 },
        { columnId: COL.desc,     value: description },
        { columnId: COL.risk,     value: risk },
      ]
    };

    await this.request('POST', `/sheets/${this.sheetId}/rows`, newRow);
    console.log(`✅ Added task ${taskId}: ${title}`);
  }

  async addSubTask(parentTaskId, title, category = 'Feature Development', priority = 'Medium', description = '', status = 'Not Started', risk = 'Low') {
    const COL = {
      taskId:   148899208318852,
      name:     4652498835689348,
      phase:    2400699022004100,
      category: 6904298649374596,
      priority: 1274799115161476,
      status:   5778398742531972,
      pct:      3526598928846724,
      desc:     1837749068582788,
      risk:     2682173998714756,
    };

    // Find the parent row by task ID
    const sheet = await this.getSheet();
    const parentRow = sheet.rows.find(r =>
      r.cells.find(c => c.columnId === COL.taskId && String(c.value) === String(parentTaskId))
    );

    if (!parentRow) {
      console.error(`❌ Parent task ${parentTaskId} not found in sheet`);
      return;
    }

    // Count existing children to generate sub-ID (e.g. 3.24.1, 3.24.2 ...)
    const subPrefix = `${parentTaskId}.`;
    const existingChildren = sheet.rows.filter(r =>
      r.cells.find(c => c.columnId === COL.taskId && String(c.value ?? '').startsWith(subPrefix))
    );
    const subId = `${parentTaskId}.${existingChildren.length + 1}`;

    // Inherit phase label from parent
    const parentPhase = parentRow.cells.find(c => c.columnId === COL.phase)?.value ?? '';

    const newRow = {
      parentId: parentRow.id,  // makes this a child row (indented in Smartsheet)
      cells: [
        { columnId: COL.taskId,   value: subId },
        { columnId: COL.name,     value: title },
        { columnId: COL.phase,    value: parentPhase },
        { columnId: COL.category, value: category },
        { columnId: COL.priority, value: priority },
        { columnId: COL.status,   value: status },
        { columnId: COL.pct,      value: status === 'Complete' ? 1 : 0 },
        { columnId: COL.desc,     value: description },
        { columnId: COL.risk,     value: risk },
      ]
    };

    await this.request('POST', `/sheets/${this.sheetId}/rows`, newRow);
    console.log(`✅ Added subtask ${subId} under ${parentTaskId}: ${title}`);
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
  status <taskId> <status>          - Update task status
  complete <taskId>                  - Mark task as complete (100%)
  add <taskId> <title> [category] [priority] [description] [status] [risk]
                                     - Add new top-level task row (inserts after predecessor)
  subtask <parentTaskId> <title> [category] [priority] [description] [status] [risk]
                                     - Add child row indented under a parent task
  sync                               - Show recent git commits
  sheet                              - View sheet info

📝 Examples:
  node smartsheet-cli.js complete 3.19
  node smartsheet-cli.js status 3.19 "In Progress"
  node smartsheet-cli.js add 3.19 "My Feature" "Feature Development" "High" "Description" "Complete" "Low"
  node smartsheet-cli.js subtask 3.24 "PDF text extraction" "Feature Development" "High" "Use pdf-parse to extract text from uploaded PDFs" "Not Started" "Low"
  node smartsheet-cli.js sync

⚠️  Notes:
  - "Assigned To" column is CONTACT type — it is intentionally omitted from all commands
  - taskId must be a string like "3.19" (the phase prefix determines the SDLC Phase label)
  - subtask IDs are auto-generated as <parentId>.<n> (e.g. 3.24.1, 3.24.2)

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
        console.error('❌ Usage: add <taskId> <title> [category] [priority] [description] [status] [risk]');
        console.error('   Example: node smartsheet-cli.js add 3.19 "My Feature" "Feature Development" "High" "Description here" "Complete" "Low"');
        return;
      }
      await cli.addTask(args[0], args[1], args[2], args[3], args[4], args[5], args[6]);
      break;
      
    case 'subtask':
      if (args.length < 2) {
        console.error('❌ Usage: subtask <parentTaskId> <title> [category] [priority] [description] [status] [risk]');
        return;
      }
      await cli.addSubTask(args[0], args[1], args[2], args[3], args[4], args[5], args[6]);
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

// Check if this file is being run directly (cross-platform, handles Windows backslashes)
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename)) {
  main().catch(error => {
    console.error('❌ CLI Error:', error.message);
    console.error(error);
  });
}

export default SmartsheetCLI;