#!/usr/bin/env node

/**
 * Compare working rows vs empty rows to understand the difference
 */

import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local', quiet: true });
dotenv.config({ quiet: true });

const apiToken = process.env.SMARTSHEET_API_TOKEN;
const sheetId = process.env.SMARTSHEET_SHEET_ID;

async function compareRows() {
  console.log('🔍 Comparing working rows vs empty rows...');

  if (!apiToken || !sheetId) {
    console.error('❌ Missing credentials');
    process.exit(1);
  }

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
    
    // Find a working row (task 1.1)
    const taskIdColumn = sheet.columns.find(col => col.title === 'Task ID');
    const workingRow = sheet.rows.find(row => {
      const taskIdCell = row.cells.find(cell => cell.columnId === taskIdColumn.id);
      return taskIdCell && taskIdCell.value === '1.1';
    });

    // Find our empty row
    const emptyRow = sheet.rows.find(row => row.id === 6502083164049284);

    console.log('📊 WORKING ROW (Task 1.1):');
    console.log(`   Row ID: ${workingRow?.id}`);
    console.log(`   Row Number: ${workingRow?.rowNumber}`);
    console.log(`   Created: ${workingRow?.createdAt}`);
    
    // Show first few cells of working row
    console.log('   Cell structure:');
    workingRow?.cells.slice(0, 5).forEach(cell => {
      const column = sheet.columns.find(col => col.id === cell.columnId);
      console.log(`     ${column?.title}: {`);
      console.log(`       columnId: ${cell.columnId}`);
      console.log(`       value: ${JSON.stringify(cell.value)}`);
      console.log(`       displayValue: ${JSON.stringify(cell.displayValue)}`);
      console.log(`       formula: ${JSON.stringify(cell.formula)}`);
      console.log(`     }`);
    });

    console.log('\n📊 EMPTY ROW (Our creation):');
    console.log(`   Row ID: ${emptyRow?.id}`);
    console.log(`   Row Number: ${emptyRow?.rowNumber}`);
    console.log(`   Created: ${emptyRow?.createdAt}`);
    
    // Show first few cells of empty row
    console.log('   Cell structure:');
    emptyRow?.cells.slice(0, 5).forEach(cell => {
      const column = sheet.columns.find(col => col.id === cell.columnId);
      console.log(`     ${column?.title}: {`);
      console.log(`       columnId: ${cell.columnId}`);
      console.log(`       value: ${JSON.stringify(cell.value)}`);
      console.log(`       displayValue: ${JSON.stringify(cell.displayValue)}`);
      console.log(`       formula: ${JSON.stringify(cell.formula)}`);
      console.log(`     }`);
    });

    // Try to manually set cell values by looking at exact cell structure
    console.log('\n🎯 CELL COMPARISON:');
    const workingTaskIdCell = workingRow?.cells.find(cell => cell.columnId === taskIdColumn.id);
    const emptyTaskIdCell = emptyRow?.cells.find(cell => cell.columnId === taskIdColumn.id);
    
    console.log('Working Task ID Cell:');
    console.log(JSON.stringify(workingTaskIdCell, null, 2));
    console.log('Empty Task ID Cell:');
    console.log(JSON.stringify(emptyTaskIdCell, null, 2));

  } catch (error) {
    console.error('❌ Error comparing rows:');
    console.error('Status:', error.response?.status);
    console.error('Message:', error.response?.data?.message || error.message);
  }
}

compareRows();