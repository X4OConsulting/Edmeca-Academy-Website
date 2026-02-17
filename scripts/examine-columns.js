#!/usr/bin/env node
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config({ path: '.env.local' });

const SMARTSHEET_API_TOKEN = process.env.SMARTSHEET_API_TOKEN;
const SHEET_ID = process.env.SMARTSHEET_SHEET_ID;

async function examineColumns() {
  try {
    console.log('🔍 Examining sheet columns...\n');

    const response = await axios.get(
      `https://api.smartsheet.com/2.0/sheets/${SHEET_ID}`,
      {
        headers: {
          Authorization: `Bearer ${SMARTSHEET_API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const columns = response.data.columns;

    console.log('📊 Column Details:\n');
    columns.forEach(col => {
      console.log(`Column: ${col.title}`);
      console.log(`  ID: ${col.id}`);
      console.log(`  Type: ${col.type}`);
      if (col.options) {
        console.log(`  Options: ${JSON.stringify(col.options)}`);
      }
      if (col.validation !== undefined) {
        console.log(`  Validation: ${col.validation}`);
      }
      console.log('');
    });

    // Also examine a successful row to see cell format
    console.log('\n📝 Sample successful row (Task 1.1):\n');
    const task11Row = response.data.rows.find(row => {
      const taskIdCell = row.cells.find(cell => cell.columnId === columns.find(c => c.title === 'Task ID')?.id);
      return taskIdCell && (taskIdCell.displayValue === '1.1' || taskIdCell.value === 1.1);
    });

    if (task11Row) {
      console.log('Row cells:');
      task11Row.cells.forEach(cell => {
        const column = columns.find(c => c.id === cell.columnId);
        console.log(`  ${column?.title}:`);
        console.log(`    value: ${JSON.stringify(cell.value)}`);
        console.log(`    displayValue: ${cell.displayValue}`);
        if (cell.objectValue) {
          console.log(`    objectValue: ${JSON.stringify(cell.objectValue)}`);
        }
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

examineColumns();
