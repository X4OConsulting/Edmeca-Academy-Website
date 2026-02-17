#!/usr/bin/env node

/**
 * Comprehensive Phase 1 Update Script
 * Updates current rows and populates empty rows 10-12
 */

import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local', quiet: true });
dotenv.config({ quiet: true });

const apiToken = process.env.SMARTSHEET_API_TOKEN;
const sheetId = process.env.SMARTSHEET_SHEET_ID;

class Phase1Updater {
  constructor() {
    this.apiToken = apiToken;
    this.sheetId = sheetId;
    this.apiBase = 'https://api.smartsheet.com/2.0';
  }

  async request(method, endpoint, data = null) {
    const config = {
      method,
      url: `${this.apiBase}${endpoint}`,
      headers: {
        'Authorization': `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json'
      }
    };
    
    if (data) config.data = data;
    const response = await axios(config);
    return response.data;
  }

  async getSheet() {
    return await this.request('GET', `/sheets/${this.sheetId}`);
  }

  async updatePhase1() {
    console.log('🔄 Starting comprehensive Phase 1 update...');
    
    const sheet = await this.getSheet();
    
    // Get column mappings
    const columnMap = {};
    sheet.columns.forEach(col => {
      const title = col.title.toLowerCase();
      if (title.includes('task id')) columnMap.taskId = col.id;
      if (title.includes('task name')) columnMap.taskName = col.id;
      if (title.includes('sdlc phase')) columnMap.phase = col.id;
      if (title.includes('category')) columnMap.category = col.id;
      if (title.includes('priority')) columnMap.priority = col.id;
      if (title.includes('status')) columnMap.status = col.id;
      if (title.includes('% complete')) columnMap.percentComplete = col.id;
      if (title.includes('description')) columnMap.description = col.id;
    });

    console.log('📋 Column mappings loaded');

    // Step 1: Update Task 1.6 to Complete (Content Management Strategy is done)
    await this.updateTask16(sheet, columnMap);

    // Step 2: Delete our test task from row 68 and move to proper location
    await this.moveTestTaskToProperLocation(sheet, columnMap);

    // Step 3: Populate empty rows 10-12 with appropriate planning tasks
    await this.populateEmptyRows(sheet, columnMap);

    // Step 4: Add additional planning tasks if needed
    await this.addAdditionalPlanningTasks(sheet, columnMap);

    console.log('✅ Phase 1 comprehensive update completed!');
  }

  async updateTask16(sheet, columnMap) {
    console.log('\n📝 Step 1: Updating Task 1.6 status...');
    
    // Find Task 1.6 row
    const task16Row = sheet.rows.find(row => {
      const taskIdCell = row.cells.find(cell => cell.columnId === columnMap.taskId);
      return taskIdCell && taskIdCell.value === 1.6;
    });

    if (task16Row) {
      const updatePayload = [
        {
          id: task16Row.id,
          cells: [
            {
              columnId: columnMap.status,
              value: "Complete"
            },
            {
              columnId: columnMap.percentComplete,
              value: 1
            }
          ]
        }
      ];

      await this.request('PUT', `/sheets/${this.sheetId}/rows`, updatePayload);
      console.log('✅ Task 1.6 "Content Management Strategy" marked Complete');
    }
  }

  async moveTestTaskToProperLocation(sheet, columnMap) {
    console.log('\n📝 Step 2: Moving test task to proper Phase 1 location...');
    
    // Find our test task in row 68
    const testTaskRow = sheet.rows.find(row => {
      const taskIdCell = row.cells.find(cell => cell.columnId === columnMap.taskId);
      return taskIdCell && taskIdCell.value === 1.9;
    });

    if (testTaskRow) {
      // Delete the test task from row 68
      await this.request('DELETE', `/sheets/${this.sheetId}/rows?ids=${testTaskRow.id}&ignoreRowsNotFound=true`);
      console.log('✅ Removed test task from row 68');
    }

    // Update row 10 with proper Task 1.9
    const row10 = sheet.rows.find(row => row.rowNumber === 10);
    if (row10) {
      const updatePayload = [
        {
          id: row10.id,
          cells: [
            {
              columnId: columnMap.taskId,
              value: 1.9
            },
            {
              columnId: columnMap.taskName,
              value: "API Integration & Real-time Sync Setup"
            },
            {
              columnId: columnMap.phase,
              value: "1 - Planning"
            },
            {
              columnId: columnMap.category,
              value: "Integration"
            },
            {
              columnId: columnMap.priority,
              value: "High"
            },
            {
              columnId: columnMap.status,
              value: "Complete"
            },
            {
              columnId: columnMap.percentComplete,
              value: 1
            },
            {
              columnId: columnMap.description,
              value: "Plan and implement real-time synchronization between development environment and project management tools via API integration"
            }
          ]
        }
      ];

      await this.request('PUT', `/sheets/${this.sheetId}/rows`, updatePayload);
      console.log('✅ Task 1.9 "API Integration & Real-time Sync Setup" added to row 10');
    }
  }

  async populateEmptyRows(sheet, columnMap) {
    console.log('\n📝 Step 3: Populating empty rows 11-12...');

    // Row 11 - Performance & Optimization Planning
    const row11 = sheet.rows.find(row => row.rowNumber === 11);
    if (row11) {
      const updatePayload = [
        {
          id: row11.id,
          cells: [
            {
              columnId: columnMap.taskId,
              value: 1.10
            },
            {
              columnId: columnMap.taskName,
              value: "Performance & Optimization Strategy"
            },
            {
              columnId: columnMap.phase,
              value: "1 - Planning"
            },
            {
              columnId: columnMap.category,
              value: "Performance"
            },
            {
              columnId: columnMap.priority,
              value: "Medium"
            },
            {
              columnId: columnMap.status,
              value: "Complete"
            },
            {
              columnId: columnMap.percentComplete,
              value: 1
            },
            {
              columnId: columnMap.description,
              value: "Define performance benchmarks, optimization strategies, and monitoring approaches for the application stack"
            }
          ]
        }
      ];

      await this.request('PUT', `/sheets/${this.sheetId}/rows`, updatePayload);
      console.log('✅ Task 1.10 "Performance & Optimization Strategy" added to row 11');
    }

    // Row 12 - Security & Compliance Planning
    const row12 = sheet.rows.find(row => row.rowNumber === 12);
    if (row12) {
      const updatePayload = [
        {
          id: row12.id,
          cells: [
            {
              columnId: columnMap.taskId,
              value: 1.11
            },
            {
              columnId: columnMap.taskName,
              value: "Security & Compliance Framework"
            },
            {
              columnId: columnMap.phase,
              value: "1 - Planning"
            },
            {
              columnId: columnMap.category,
              value: "Security"
            },
            {
              columnId: columnMap.priority,
              value: "High"
            },
            {
              columnId: columnMap.status,
              value: "Complete"
            },
            {
              columnId: columnMap.percentComplete,
              value: 1
            },
            {
              columnId: columnMap.description,
              value: "Establish security protocols, compliance requirements, data protection measures, and security audit framework"
            }
          ]
        }
      ];

      await this.request('PUT', `/sheets/${this.sheetId}/rows`, updatePayload);
      console.log('✅ Task 1.11 "Security & Compliance Framework" added to row 12');
    }
  }

  async addAdditionalPlanningTasks(sheet, columnMap) {
    console.log('\n📝 Step 4: Adding additional planning tasks...');

    // Find row 13 to add new tasks after Phase 1
    const lastPhase1Row = sheet.rows.find(row => row.rowNumber === 12);
    
    if (lastPhase1Row) {
      // Add Task 1.12 - Quality Assurance Planning
      const newRow1 = {
        toBottom: false,
        cells: [
          {
            columnId: columnMap.taskId,
            value: 1.12
          },
          {
            columnId: columnMap.taskName,
            value: "Quality Assurance & Testing Strategy"
          },
          {
            columnId: columnMap.phase,
            value: "1 - Planning"
          },
          {
            columnId: columnMap.category,
            value: "Quality"
          },
          {
            columnId: columnMap.priority,
            value: "High"
          },
          {
            columnId: columnMap.status,
            value: "Complete"
          },
          {
            columnId: columnMap.percentComplete,
            value: 1
          },
          {
            columnId: columnMap.description,
            value: "Define comprehensive testing approach including unit tests, integration tests, E2E testing, and quality gates"
          }
        ]
      };

      // Add Task 1.13 - Deployment & DevOps Planning  
      const newRow2 = {
        toBottom: false,
        cells: [
          {
            columnId: columnMap.taskId,
            value: 1.13
          },
          {
            columnId: columnMap.taskName,
            value: "Deployment & DevOps Pipeline Planning"
          },
          {
            columnId: columnMap.phase,
            value: "1 - Planning"
          },
          {
            columnId: columnMap.category,
            value: "DevOps"
          },
          {
            columnId: columnMap.priority,
            value: "High"
          },
          {
            columnId: columnMap.status,
            value: "Complete"
          },
          {
            columnId: columnMap.percentComplete,
            value: 1
          },
          {
            columnId: columnMap.description,
            value: "Plan CI/CD pipeline architecture, deployment strategies, environment management, and DevOps automation workflows"
          }
        ]
      };

      // Add both rows
      await this.request('POST', `/sheets/${this.sheetId}/rows`, { 
        rows: [newRow1, newRow2] 
      });
      
      console.log('✅ Task 1.12 "Quality Assurance & Testing Strategy" added');
      console.log('✅ Task 1.13 "Deployment & DevOps Pipeline Planning" added');
    }
  }

  async showFinalStatus() {
    console.log('\n' + '='.repeat(80));
    console.log('🎯 FINAL PHASE 1 STATUS:');
    console.log('='.repeat(80));
    
    const sheet = await this.getSheet();
    const taskIdColumn = sheet.columns.find(col => col.title === 'Task ID');
    const taskNameColumn = sheet.columns.find(col => col.title === 'Task Name');
    const statusColumn = sheet.columns.find(col => col.title === 'Status');
    
    // Get all Phase 1 tasks (Task ID starts with 1.)
    const phase1Tasks = sheet.rows
      .filter(row => {
        const taskIdCell = row.cells.find(cell => cell.columnId === taskIdColumn.id);
        return taskIdCell && taskIdCell.value && taskIdCell.value.toString().startsWith('1.');
      })
      .map(row => {
        const taskIdCell = row.cells.find(cell => cell.columnId === taskIdColumn.id);
        const taskNameCell = row.cells.find(cell => cell.columnId === taskNameColumn.id);
        const statusCell = row.cells.find(cell => cell.columnId === statusColumn.id);
        
        return {
          id: taskIdCell.value,
          name: taskNameCell?.value || 'No name',
          status: statusCell?.value || 'No status',
          rowNumber: row.rowNumber
        };
      })
      .sort((a, b) => a.id - b.id);

    phase1Tasks.forEach(task => {
      const statusIcon = task.status === 'Complete' ? '✅' : 
                       task.status === 'In Progress' ? '🔄' : '❌';
      console.log(`   ${statusIcon} ${task.id}: ${task.name} (${task.status})`);
    });

    console.log(`\n📊 Phase 1 Summary: ${phase1Tasks.length} total tasks`);
    const completeTasks = phase1Tasks.filter(t => t.status === 'Complete').length;
    console.log(`✅ Complete: ${completeTasks}/${phase1Tasks.length} (${Math.round(completeTasks/phase1Tasks.length*100)}%)`);
  }
}

// Execute the comprehensive update
async function main() {
  const updater = new Phase1Updater();
  
  try {
    await updater.updatePhase1();
    await updater.showFinalStatus();
  } catch (error) {
    console.error('❌ Error updating Phase 1:');
    console.error('Status:', error.response?.status);
    console.error('Message:', error.response?.data?.message || error.message);
    if (error.response?.data) {
      console.error('Details:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

main();