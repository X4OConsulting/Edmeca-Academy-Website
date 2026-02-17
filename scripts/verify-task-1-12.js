#!/usr/bin/env node

/**
 * Verify task 1.12 exists in Smartsheet
 */

import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local', quiet: true });
dotenv.config({ quiet: true });

const apiToken = process.env.SMARTSHEET_API_TOKEN;
const sheetId = process.env.SMARTSHEET_SHEET_ID;

async function verifyTask112() {
  console.log('🔍 Searching for task 1.12 in Smartsheet...\n');

  try {
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
    console.log(`📊 Sheet: ${sheet.name}`);
    console.log(`📝 Total rows: ${sheet.rows.length}\n`);
    
    // Map columns
    const columnMap = {};
    sheet.columns.forEach(col => {
      const title = col.title.toLowerCase();
      if (title.includes('task id')) columnMap.taskId = col.id;
      if (title.includes('task name')) columnMap.taskName = col.id;
      if (title.includes('sdlc phase') || title === 'phase') columnMap.phase = col.id;
      if (title.includes('status')) columnMap.status = col.id;
    });

    // Find all tasks with task IDs starting with 1.
    const phase1Tasks = [];
    sheet.rows.forEach((row, index) => {
      const taskIdCell = row.cells.find(cell => cell.columnId === columnMap.taskId);
      const taskNameCell = row.cells.find(cell => cell.columnId === columnMap.taskName);
      const phaseCell = row.cells.find(cell => cell.columnId === columnMap.phase);
      const statusCell = row.cells.find(cell => cell.columnId === columnMap.status);
      
      const taskId = taskIdCell?.value;
      
      if (taskId && (taskId.toString().startsWith('1.') || taskId === 1)) {
        phase1Tasks.push({
          rowNumber: index + 1,
          rowId: row.id,
          taskId: taskId,
          taskName: taskNameCell?.value || '',
          phase: phaseCell?.value || '',
          status: statusCell?.value || ''
        });
      }
    });

    console.log('📋 All Phase 1 tasks found:\n');
    phase1Tasks
      .sort((a, b) => {
        const aNum = typeof a.taskId === 'number' ? a.taskId : parseFloat(a.taskId);
        const bNum = typeof b.taskId === 'number' ? b.taskId : parseFloat(b.taskId);
        return aNum - bNum;
      })
      .forEach(task => {
        const marker = task.taskId === 1.12 ? '👉 ' : '   ';
        console.log(`${marker}Row ${task.rowNumber}: Task ${task.taskId} - ${task.taskName}`);
        if (task.taskId === 1.12) {
          console.log(`   ✅ Status: ${task.status}`);
          console.log(`   🔗 Row ID: ${task.rowId}`);
        }
      });

    const task112 = phase1Tasks.find(t => t.taskId === 1.12 || t.taskId === '1.12');
    
    if (task112) {
      console.log('\n✅ Task 1.12 EXISTS in Smartsheet!');
      console.log(`📍 Located at row ${task112.rowNumber}`);
      console.log(`📝 Task Name: ${task112.taskName}`);
      console.log(`🔗 Row ID: ${task112.rowId}`);
      console.log('\n💡 Try refreshing your Smartsheet browser tab to see the new row.');
    } else {
      console.log('\n❌ Task 1.12 NOT FOUND in Smartsheet');
      console.log('💡 The row may not have been created successfully.');
    }

  } catch (error) {
    console.error('❌ Error:', error.response?.data?.message || error.message);
  }
}

verifyTask112();
