#!/usr/bin/env node

/**
 * Verify the test task exists in Smartsheet
 */

import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local', quiet: true });
dotenv.config({ quiet: true });

const apiToken = process.env.SMARTSHEET_API_TOKEN;
const sheetId = process.env.SMARTSHEET_SHEET_ID;

async function verifyTestTask() {
  console.log('🔍 Verifying test task 1.9 exists in Smartsheet...');

  if (!apiToken || !sheetId) {
    console.error('❌ Missing credentials');
    process.exit(1);
  }

  try {
    // Get the sheet with all data
    console.log('📊 Fetching complete sheet data...');
    
    const sheetResponse = await axios.get(
      `https://api.smartsheet.com/2.0/sheets/${sheetId}?include=rowPermalinks`,
      {
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const sheet = sheetResponse.data;
    console.log(`✅ Retrieved sheet: ${sheet.name}`);
    console.log(`📝 Total rows: ${sheet.rows.length}`);
    
    // Find task ID column
    const taskIdColumn = sheet.columns.find(col => 
      col.title.toLowerCase().includes('task id')
    );
    
    const taskNameColumn = sheet.columns.find(col => 
      col.title.toLowerCase().includes('task name')
    );
    
    const statusColumn = sheet.columns.find(col => 
      col.title.toLowerCase().includes('status')
    );

    if (!taskIdColumn) {
      console.error('❌ Could not find Task ID column');
      return;
    }

    console.log(`🔍 Looking for task 1.9 in column ${taskIdColumn.id}...`);

    // Search for task 1.9
    const task19Row = sheet.rows.find(row => {
      const taskIdCell = row.cells.find(cell => cell.columnId === taskIdColumn.id);
      return taskIdCell && taskIdCell.value === '1.9';
    });

    if (task19Row) {
      console.log('✅ Found task 1.9!');
      console.log(`   Row ID: ${task19Row.id}`);
      console.log(`   Row Number: ${task19Row.rowNumber}`);
      console.log(`   Created: ${task19Row.createdAt}`);
      console.log(`   Modified: ${task19Row.modifiedAt}`);
      console.log(`   Permalink: ${task19Row.permalink || 'Not available'}`);
      
      // Get task details
      const taskNameCell = task19Row.cells.find(cell => cell.columnId === taskNameColumn?.id);
      const statusCell = task19Row.cells.find(cell => cell.columnId === statusColumn?.id);
      
      console.log('\n📋 Task Details:');
      console.log(`   Task Name: ${taskNameCell?.displayValue || taskNameCell?.value || 'Not set'}`);
      console.log(`   Status: ${statusCell?.displayValue || statusCell?.value || 'Not set'}`);
      
      // Show all cell values
      console.log('\n📝 All Cell Values:');
      task19Row.cells.forEach(cell => {
        const column = sheet.columns.find(col => col.id === cell.columnId);
        if (cell.value !== null && cell.value !== undefined && cell.value !== '') {
          console.log(`   ${column?.title}: ${cell.displayValue || cell.value}`);
        }
      });
      
    } else {
      console.log('❌ Task 1.9 NOT found in sheet');
      
      // Show all Phase 1 tasks for comparison
      console.log('\n🔍 All Phase 1 tasks found:');
      const phase1Tasks = sheet.rows
        .filter(row => {
          const taskIdCell = row.cells.find(cell => cell.columnId === taskIdColumn.id);
          return taskIdCell && taskIdCell.value && taskIdCell.value.toString().startsWith('1.');
        })
        .map(row => {
          const taskIdCell = row.cells.find(cell => cell.columnId === taskIdColumn.id);
          const taskNameCell = row.cells.find(cell => cell.columnId === taskNameColumn?.id);
          return {
            id: taskIdCell.value,
            name: taskNameCell?.value || 'No name',
            rowId: row.id
          };
        });
      
      phase1Tasks.forEach(task => {
        console.log(`   ${task.id}: ${task.name} (Row ID: ${task.rowId})`);
      });
    }

    // Also check if there are any filters or views affecting visibility
    console.log('\n🔍 Sheet Configuration:');
    console.log(`   Access Level: ${sheet.accessLevel}`);
    console.log(`   Read Only: ${sheet.readOnly}`);
    console.log(`   Has Summary Fields: ${sheet.hasSummaryFields || false}`);
    console.log(`   Version: ${sheet.version}`);
    
    if (sheet.filters && sheet.filters.length > 0) {
      console.log('⚠️  Active filters detected:');
      sheet.filters.forEach(filter => {
        console.log(`   Filter ID: ${filter.id}, Type: ${filter.filterType}`);
      });
    }

  } catch (error) {
    console.error('❌ Error verifying task:');
    console.error('Status:', error.response?.status);
    console.error('Message:', error.response?.data?.message || error.message);
    if (error.response?.data) {
      console.error('Details:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

verifyTestTask();