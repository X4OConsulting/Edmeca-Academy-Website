#!/usr/bin/env node

/**
 * Show detailed info for task 1.9
 */

import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local', quiet: true });
dotenv.config({ quiet: true });

const apiToken = process.env.SMARTSHEET_API_TOKEN;
const sheetId = process.env.SMARTSHEET_SHEET_ID;

async function showTaskInfo() {
  console.log('📋 Getting detailed task 1.9 info...');

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
    
    // Find task 1.9
    const taskIdColumn = sheet.columns.find(col => col.title === 'Task ID');
    const task19Row = sheet.rows.find(row => {
      const taskIdCell = row.cells.find(cell => cell.columnId === taskIdColumn.id);
      return taskIdCell && taskIdCell.value === 1.9;
    });

    if (!task19Row) {
      console.error('❌ Task 1.9 not found');
      return;
    }

    console.log(`✅ Found task 1.9 (Row ID: ${task19Row.id})`);
    console.log(`   Created: ${task19Row.createdAt}`);
    console.log(`   Modified: ${task19Row.modifiedAt}`);
    console.log('\n📝 All field values:');

    // Show all populated cells
    task19Row.cells.forEach(cell => {
      const column = sheet.columns.find(col => col.id === cell.columnId);
      if (cell.value !== null && cell.value !== undefined && cell.value !== '') {
        console.log(`   ${column?.title}: "${cell.displayValue || cell.value}"`);
      } else if (cell.displayValue) {
        console.log(`   ${column?.title}: "${cell.displayValue}" (display only)`);
      }
    });

    // Check Status specifically
    const statusColumn = sheet.columns.find(col => col.title.toLowerCase().includes('status'));
    const statusCell = task19Row.cells.find(cell => cell.columnId === statusColumn?.id);
    
    console.log('\n🎯 STATUS CHECK:');
    console.log(`   Status Column ID: ${statusColumn?.id}`);
    console.log(`   Status Cell: ${JSON.stringify(statusCell)}`);
    console.log(`   Current Status: "${statusCell?.displayValue || statusCell?.value || 'Empty'}"`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

showTaskInfo();