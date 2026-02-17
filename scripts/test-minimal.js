#!/usr/bin/env node
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config({ path: '.env.local' });

const SMARTSHEET_API_TOKEN = process.env.SMARTSHEET_API_TOKEN;
const SHEET_ID = process.env.SMARTSHEET_SHEET_ID;

async function addMinimalRow() {
  try {
    console.log('🚀 Testing with MINIMAL single cell...\n');

    // Get sheet structure
    const sheetResponse = await axios.get(
      `https://api.smartsheet.com/2.0/sheets/${SHEET_ID}`,
      {
        headers: {
          Authorization: `Bearer ${SMARTSHEET_API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const sheet = sheetResponse.data;
    const columns = sheet.columns;

    // Map column names to IDs
    const columnMap = {};
    columns.forEach(col => {
      columnMap[col.title] = col.id;
    });

    // Find row 12 (task 1.11)
    const row12 = sheet.rows.find(row => {
      const taskIdCell = row.cells.find(cell => cell.columnId === columnMap['Task ID']);
      return taskIdCell && taskIdCell.displayValue === '1.11';
    });

    console.log(`Column ID for 'Task ID': ${columnMap['Task ID']}`);
    console.log(`Column ID for 'Task Name': ${columnMap['Task Name']}`);
    console.log(`Inserting after row 12 (Row ID: ${row12.id})\n`);

    // Try with just the Task ID column
    const rowData = {
      rows: [{
        siblingId: row12.id,
        cells: [
          {
            columnId: columnMap['Task ID'],
            value: 1.12
          }
        ]
      }]
    };

    console.log('Request:', JSON.stringify(rowData, null, 2));
    console.log('\n📤 Adding row with ONLY Task ID...\n');

    // Add the row
    const addResponse = await axios.post(
      `https://api.smartsheet.com/2.0/sheets/${SHEET_ID}/rows`,
      rowData,
      {
        headers: {
          Authorization: `Bearer ${SMARTSHEET_API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('Full Response:', JSON.stringify(addResponse.data, null, 2));

    // Now let's IMMEDIATELY fetch the sheet again to see what was created
    console.log('\n🔍 Fetching sheet again to verify...\n');
    
    const verifyResponse = await axios.get(
      `https://api.smartsheet.com/2.0/sheets/${SHEET_ID}`,
      {
        headers: {
          Authorization: `Bearer ${SMARTSHEET_API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const newRowId = addResponse.data.result.id;
    const createdRow = verifyResponse.data.rows.find(r => r.id === newRowId);
    
    if (createdRow) {
      console.log('Created row found:');
      const taskIdCell = createdRow.cells.find(c => c.columnId === columnMap['Task ID']);
      console.log('  Task ID cell:', JSON.stringify(taskIdCell, null, 2));
    }

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

addMinimalRow();
