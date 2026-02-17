#!/usr/bin/env node

/**
 * Add a test task to Smartsheet Phase 1
 */

import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local', quiet: true });
dotenv.config({ quiet: true });

const apiToken = process.env.SMARTSHEET_API_TOKEN;
const sheetId = process.env.SMARTSHEET_SHEET_ID;

async function addTestTask() {
  console.log('🧪 Adding test task to Phase 1...');
  console.log(`📋 Sheet ID: ${sheetId}`);
  console.log(`🔑 Token: ${apiToken?.substring(0, 10)}...`);

  if (!apiToken || !sheetId) {
    console.error('❌ Missing credentials');
    process.exit(1);
  }

  try {
    // First, get the sheet structure to find column IDs
    console.log('📊 Getting sheet structure...');
    
    const sheetResponse = await axios.get(
      `https://api.smartsheet.com/2.0/sheets/${sheetId}`,
      {
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const sheet = sheetResponse.data;
    console.log(`✅ Retrieved sheet: ${sheet.name}`);
    console.log(`📝 Current rows: ${sheet.rows.length}`);
    
    // Map column names to IDs
    const columnMap = {};
    sheet.columns.forEach(col => {
      const title = col.title.toLowerCase();
      columnMap[col.title] = col.id;
      
      // Create friendly mappings
      if (title.includes('task id')) columnMap.taskId = col.id;
      if (title.includes('task name')) columnMap.taskName = col.id;
      if (title.includes('description')) columnMap.description = col.id;
      if (title.includes('priority')) columnMap.priority = col.id;
      if (title.includes('status')) columnMap.status = col.id;
      if (title.includes('sdlc phase') || title.includes('phase')) columnMap.phase = col.id;
      if (title.includes('category')) columnMap.category = col.id;
      if (title.includes('% complete')) columnMap.percentComplete = col.id;
    });

    console.log('📋 Column mappings found:');
    Object.entries(columnMap).forEach(([name, id]) => {
      if (typeof id === 'number') console.log(`   ${name}: ${id}`);
    });

    // Find existing Phase 1 tasks to determine next task ID
    const phase1Tasks = sheet.rows
      .filter(row => {
        const taskIdCell = row.cells.find(cell => cell.columnId === columnMap.taskId);
        return taskIdCell && taskIdCell.value && taskIdCell.value.toString().startsWith('1.');
      })
      .map(row => {
        const taskIdCell = row.cells.find(cell => cell.columnId === columnMap.taskId);
        return taskIdCell.value.toString();
      })
      .sort();

    console.log('🔍 Existing Phase 1 tasks:', phase1Tasks);

    // Generate next task ID
    let nextTaskNumber = 1;
    if (phase1Tasks.length > 0) {
      const lastTask = phase1Tasks[phase1Tasks.length - 1];
      const lastNumber = parseInt(lastTask.split('.')[1]) || 0;
      nextTaskNumber = lastNumber + 1;
    }
    
    const newTaskId = `1.${nextTaskNumber}`;
    console.log(`🆕 Creating task: ${newTaskId}`);

    // Prepare the new row data
    const newRow = {
      toTop: false,
      cells: []
    };

    // Add cells for each column we want to populate
    if (columnMap.taskId) {
      newRow.cells.push({
        columnId: columnMap.taskId,
        value: parseFloat(newTaskId)  // NUMERIC value for Task ID!
      });
    }

    if (columnMap.taskName) {
      newRow.cells.push({
        columnId: columnMap.taskName,
        value: "Test Smartsheet Integration via API"
      });
    }

    if (columnMap.description) {
      newRow.cells.push({
        columnId: columnMap.description,
        value: "Verify that the real-time sync between VS Code and Smartsheet is working properly through API calls"
      });
    }

    if (columnMap.phase) {
      newRow.cells.push({
        columnId: columnMap.phase,
        value: "1 - Planning"  // Fixed: Match exact picklist value
      });
    }

    if (columnMap.category) {
      newRow.cells.push({
        columnId: columnMap.category,
        value: "API Integration"  // Better category name
      });
    }

    if (columnMap.priority) {
      newRow.cells.push({
        columnId: columnMap.priority,
        value: "High"  // This matches the picklist
      });
    }

    if (columnMap.status) {
      newRow.cells.push({
        columnId: columnMap.status,
        value: "In Progress"  // This matches the picklist
      });
    }

    if (columnMap.percentComplete) {
      newRow.cells.push({
        columnId: columnMap.percentComplete,
        value: 0.25  // Numeric value for 25%
      });
    }

    console.log('📝 Row data prepared:', JSON.stringify(newRow, null, 2));

    // Add the row to Smartsheet
    console.log('📤 Adding row to Smartsheet...');
    
    const addResponse = await axios.post(
      `https://api.smartsheet.com/2.0/sheets/${sheetId}/rows`,
      { rows: [newRow] },
      {
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Task added successfully!');
    console.log(`📋 New task ID: ${newTaskId}`);
    console.log('📊 Response data:', JSON.stringify(addResponse.data, null, 2));
    
    if (addResponse.data.result && addResponse.data.result[0]) {
      console.log(`🔗 Row ID: ${addResponse.data.result[0].id}`);
    }
    
    console.log('');
    console.log('🎯 You can now test the integration by:');
    console.log(`   1. Running: npm run task:complete ${newTaskId}`);
    console.log(`   2. Or add this to a code file: /* COMPLETE: ${newTaskId} */`);
    console.log(`   3. Or commit with: git commit -m "feat: complete integration test (${newTaskId})"`);

  } catch (error) {
    console.error('❌ Error adding task:');
    console.error('Status:', error.response?.status);
    console.error('Message:', error.response?.data?.message || error.message);
    if (error.response?.data) {
      console.error('Details:', JSON.stringify(error.response.data, null, 2));
    }
    console.error('Full error:', error.message);
  }
}

addTestTask();