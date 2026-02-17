import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';

interface SmartsheetConfig {
  apiToken: string;
  sheetId: string;
  autoSync: boolean;
  syncOnSave: boolean;
  syncOnCommit: boolean;
}

interface TaskUpdate {
  taskId: string;
  status: string;
  percentComplete?: number;
  assignedTo?: string;
  notes?: string;
}

export class SmartsheetIntegration {
  private config: SmartsheetConfig;
  private statusBarItem: vscode.StatusBarItem;
  private fileWatcher: vscode.FileSystemWatcher | undefined;
  private gitWatcher: vscode.FileSystemWatcher | undefined;
  private lastSyncTime: Date = new Date();

  constructor(private context: vscode.ExtensionContext) {
    this.config = this.loadConfig();
    this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    this.setup();
  }

  private loadConfig(): SmartsheetConfig {
    const config = vscode.workspace.getConfiguration('edmeca.smartsheet');
    return {
      apiToken: config.get('apiToken') || process.env.SMARTSHEET_API_TOKEN || '',
      sheetId: config.get('sheetId') || process.env.SMARTSHEET_SHEET_ID || '',
      autoSync: config.get('autoSync', true),
      syncOnSave: config.get('syncOnSave', true),
      syncOnCommit: config.get('syncOnCommit', true)
    };
  }

  private setup() {
    // Update status bar
    this.updateStatusBar('Ready');

    // Setup file watchers
    this.setupFileWatchers();

    // Setup git watchers  
    this.setupGitWatchers();

    // Register commands
    this.registerCommands();

    // Auto-detect completed tasks on startup
    this.detectCompletedTasks();
  }

  private setupFileWatchers() {
    // Watch for file changes that indicate task completion
    this.fileWatcher = vscode.workspace.createFileSystemWatcher('**/*.{ts,tsx,js,jsx,md}');

    this.fileWatcher.onDidChange((uri) => {
      if (this.config.syncOnSave) {
        this.handleFileChange(uri);
      }
    });

    this.fileWatcher.onDidCreate((uri) => {
      this.handleFileCreation(uri);
    });
  }

  private setupGitWatchers() {
    // Watch for git commits
    this.gitWatcher = vscode.workspace.createFileSystemWatcher('**/.git/COMMIT_EDITMSG');
    
    this.gitWatcher.onDidChange(() => {
      if (this.config.syncOnCommit) {
        setTimeout(() => this.handleGitCommit(), 1000); // Delay to ensure commit is complete
      }
    });
  }

  private registerCommands() {
    // Push to Smartsheet command
    this.context.subscriptions.push(
      vscode.commands.registerCommand('edmeca.pushToSmartsheet', () => {
        this.pushChangesToSmartsheet();
      })
    );

    // Mark task complete
    this.context.subscriptions.push(
      vscode.commands.registerCommand('edmeca.markTaskComplete', async () => {
        const taskId = await vscode.window.showInputBox({
          prompt: 'Enter Task ID to mark complete (e.g., 1.1)',
          placeHolder: '1.1'
        });
        
        if (taskId) {
          await this.markTaskComplete(taskId);
        }
      })
    );

    // Update task status
    this.context.subscriptions.push(
      vscode.commands.registerCommand('edmeca.updateTaskStatus', async () => {
        const taskId = await vscode.window.showInputBox({
          prompt: 'Enter Task ID',
          placeHolder: '1.1'
        });
        
        if (!taskId) return;

        const status = await vscode.window.showQuickPick(
          ['Not Started', 'In Progress', 'Complete', 'Blocked', 'On Hold'],
          { placeHolder: 'Select task status' }
        );

        if (status) {
          await this.updateTaskStatus(taskId, status);
        }
      })
    );

    // Sync all changes
    this.context.subscriptions.push(
      vscode.commands.registerCommand('edmeca.syncSmartsheet', () => {
        this.syncAllChanges();
      })
    );
  }

  private async handleFileChange(uri: vscode.Uri) {
    // Detect task completion based on file patterns
    const fileName = path.basename(uri.fsPath);
    const fileContent = await this.readFile(uri.fsPath);
    
    // Pattern matching for task completion
    const completionPatterns = [
      /\/\*\s*TODO:\s*COMPLETE\s*TASK\s*(\d+\.?\d*)\s*\*\//gi,
      /\/\/\s*COMPLETE:\s*(\d+\.?\d*)/gi,
      /<!--\s*COMPLETE:\s*(\d+\.?\d*)\s*-->/gi
    ];

    for (const pattern of completionPatterns) {
      const matches = fileContent.matchAll(pattern);
      for (const match of matches) {
        const taskId = match[1];
        await this.markTaskComplete(taskId);
        vscode.window.showInformationMessage(`✅ Task ${taskId} marked complete in Smartsheet`);
      }
    }

    this.updateStatusBar('File changed, checking for updates...');
    setTimeout(() => this.updateStatusBar('Synced'), 2000);
  }

  private async handleFileCreation(uri: vscode.Uri) {
    const fileName = path.basename(uri.fsPath);
    
    // Auto-detect new feature files and update corresponding tasks
    const featurePatterns = [
      { pattern: /Login\.tsx$/, taskId: '1.1' },
      { pattern: /Dashboard\.tsx$/, taskId: '2.1' },
      { pattern: /Auth/, taskId: '1.0' },
      { pattern: /\.test\./, taskId: '4.0' }
    ];

    for (const { pattern, taskId } of featurePatterns) {
      if (pattern.test(fileName)) {
        await this.updateTaskStatus(taskId, 'In Progress');
        vscode.window.showInformationMessage(`📝 Task ${taskId} updated to "In Progress"`);
      }
    }
  }

  private async handleGitCommit() {
    try {
      // Read the latest commit message
      const { exec } = require('child_process');
      exec('git log -1 --pretty=%B', async (error: any, stdout: string) => {
        if (error) return;

        const commitMessage = stdout.trim();
        await this.processCommitMessage(commitMessage);
      });
    } catch (error) {
      console.error('Error handling git commit:', error);
    }
  }

  private async processCommitMessage(message: string) {
    // Parse commit message for task references
    const taskPatterns = [
      /(?:fix|feat|complete|finish|implement).*?(\d+\.?\d*)/gi,
      /task\s*(\d+\.?\d*)/gi,
      /closes?\s*#?(\d+\.?\d*)/gi
    ];

    const completionKeywords = /^(fix|feat|complete|finish|implement|done)/i;

    for (const pattern of taskPatterns) {
      const matches = message.matchAll(pattern);
      for (const match of matches) {
        const taskId = match[1];
        
        if (completionKeywords.test(message)) {
          await this.markTaskComplete(taskId);
          vscode.window.showInformationMessage(`🎯 Git commit auto-completed task ${taskId}`);
        } else {
          await this.updateTaskStatus(taskId, 'In Progress');
        }
      }
    }

    this.updateStatusBar(`Synced commit: ${message.substring(0, 30)}...`);
  }

  private async detectCompletedTasks() {
    // Scan project files for completion markers
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) return;

    const files = await vscode.workspace.findFiles('**/*.{ts,tsx,js,jsx,md}', '**/node_modules/**');
    
    for (const file of files.slice(0, 50)) { // Limit scan for performance
      try {
        const content = await this.readFile(file.fsPath);
        
        // Look for completion markers
        const completionMarkers = content.matchAll(/\/\*\s*COMPLETE:\s*(\d+\.?\d*)\s*\*\//gi);
        for (const match of completionMarkers) {
          const taskId = match[1];
          // Silently mark as complete (don't spam messages on startup)
          await this.markTaskComplete(taskId, true);
        }
      } catch (error) {
        // Skip files that can't be read
      }
    }
  }

  private async readFile(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) reject(err);
        else resolve(data);
      });
    });
  }

  private async markTaskComplete(taskId: string, silent: boolean = false) {
    const update: TaskUpdate = {
      taskId,
      status: 'Complete',
      percentComplete: 100
    };

    await this.sendToSmartsheet(update);
    
    if (!silent) {
      this.updateStatusBar(`✅ Task ${taskId} completed`);
    }
  }

  private async updateTaskStatus(taskId: string, status: string) {
    const percentComplete = status === 'Complete' ? 100 : 
                           status === 'In Progress' ? 50 : 0;

    const update: TaskUpdate = {
      taskId,
      status,
      percentComplete
    };

    await this.sendToSmartsheet(update);
    this.updateStatusBar(`📝 Task ${taskId}: ${status}`);
  }

  private async sendToSmartsheet(update: TaskUpdate) {
    if (!this.config.apiToken || !this.config.sheetId) {
      vscode.window.showErrorMessage('Smartsheet API token or Sheet ID not configured');
      return;
    }

    try {
      // Get sheet structure
      const sheetResponse = await axios.get(
        `https://api.smartsheet.com/2.0/sheets/${this.config.sheetId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const sheet = sheetResponse.data;
      
      // Find the row with matching Task ID
      const row = sheet.rows.find((r: any) => 
        r.cells.find((c: any) => c.value === update.taskId)
      );

      if (!row) {
        vscode.window.showWarningMessage(`Task ${update.taskId} not found in Smartsheet`);
        return;
      }

      // Find relevant columns
      const columns = sheet.columns;
      const statusColumn = columns.find((c: any) => 
        c.title.toLowerCase().includes('status')
      );
      const percentColumn = columns.find((c: any) => 
        c.title.toLowerCase().includes('% complete')
      );

      // Prepare update
      const cells = [];
      
      if (statusColumn) {
        cells.push({
          columnId: statusColumn.id,
          value: update.status
        });
      }

      if (percentColumn && update.percentComplete !== undefined) {
        cells.push({
          columnId: percentColumn.id,
          value: `${update.percentComplete}%`
        });
      }

      if (cells.length === 0) return;

      // Send update
      await axios.put(
        `https://api.smartsheet.com/2.0/sheets/${this.config.sheetId}/rows`,
        {
          rows: [{
            id: row.id,
            cells
          }]
        },
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      this.lastSyncTime = new Date();
      
    } catch (error: any) {
      vscode.window.showErrorMessage(
        `Smartsheet sync failed: ${error.response?.data?.message || error.message}`
      );
    }
  }

  private async pushChangesToSmartsheet() {
    this.updateStatusBar('Pushing to Smartsheet...');
    
    // Trigger a comprehensive sync
    await this.detectCompletedTasks();
    await this.syncRecentChanges();
    
    vscode.window.showInformationMessage('✅ Changes pushed to Smartsheet');
    this.updateStatusBar('Synced');
  }

  private async syncAllChanges() {
    const progress = vscode.window.withProgress({
      location: vscode.ProgressLocation.Notification,
      title: "Syncing with Smartsheet",
      cancellable: false
    }, async (progress) => {
      progress.report({ increment: 0, message: "Scanning files..." });
      
      await this.detectCompletedTasks();
      progress.report({ increment: 50, message: "Checking git history..." });
      
      await this.syncRecentCommits();
      progress.report({ increment: 100, message: "Complete!" });
    });

    await progress;
  }

  private async syncRecentCommits() {
    // Sync recent commits with Smartsheet
    const { exec } = require('child_process');
    
    return new Promise<void>((resolve) => {
      exec('git log --oneline -10', async (error: any, stdout: string) => {
        if (error) {
          resolve();
          return;
        }

        const commits = stdout.trim().split('\n');
        for (const commit of commits) {
          await this.processCommitMessage(commit);
        }
        resolve();
      });
    });
  }

  private async syncRecentChanges() {
    // Sync recent file changes
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) return;

    try {
      const { exec } = require('child_process');
      exec('git diff --name-only HEAD~5', async (error: any, stdout: string) => {
        if (error) return;

        const changedFiles = stdout.trim().split('\n').filter(Boolean);
        for (const file of changedFiles) {
          // Process each changed file for task updates
          const fullPath = path.join(workspaceFolder.uri.fsPath, file);
          if (fs.existsSync(fullPath)) {
            await this.handleFileChange(vscode.Uri.file(fullPath));
          }
        }
      });
    } catch (error) {
      console.error('Error syncing recent changes:', error);
    }
  }

  private updateStatusBar(message: string) {
    this.statusBarItem.text = `$(sync) ${message}`;
    this.statusBarItem.command = 'edmeca.pushToSmartsheet';
    this.statusBarItem.tooltip = `Last sync: ${this.lastSyncTime.toLocaleTimeString()}`;
    this.statusBarItem.show();
  }

  dispose() {
    this.statusBarItem.dispose();
    this.fileWatcher?.dispose();
    this.gitWatcher?.dispose();
  }
}

export function activate(context: vscode.ExtensionContext) {
  const integration = new SmartsheetIntegration(context);
  context.subscriptions.push(integration);

  // Welcome message
  vscode.window.showInformationMessage(
    '🚀 EDMECA Smartsheet Integration activated! Changes will sync automatically.'
  );
}

export function deactivate() {}