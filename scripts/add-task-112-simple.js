#!/usr/bin/env node
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config({ path: '.env.local' });

const SMARTSHEET_API_TOKEN = process.env.SMARTSHEET_API_TOKEN;
const SHEET_ID = process.env.SMARTSHEET_SHEET_ID;

async function addTask112() {
  try {
    console.log('🚀 Adding task 1.12 with simplified data...\n');

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

    console.log(`📍 Inserting after row 12 (Row ID: ${row12.id})\n`);

    // Create minimal row data with only essential columns
    const rowData = {
      rows: [{
        siblingId: row12.id,
        cells: [
          {
            columnId: columnMap['Task ID'],
            value: 1.12
          },
          {
            columnId: columnMap['Task Name'],
            value: 'CI/CD Automation Pipeline Setup'
          },
          {
            columnId: columnMap['Phase'],
            value: '1 - Planning'
          },
          {
            columnId: columnMap['Category'],
            value: 'DevOps'
          },
          {
            columnId: columnMap['Priority'],
            value: 'Critical'
          },
          {
            columnId: columnMap['Status'],
            value: 'Complete'
          },
          {
            columnId: columnMap['Progress (%)'],
            value: 100
          }
        ]
      }]
    };

    console.log('📤 Adding row with minimal essential data...\n');

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

    console.log('Response:', JSON.stringify(addResponse.data, null, 2));

    if (addResponse.data.message === 'SUCCESS') {
      console.log('\n✅ Task 1.12 added successfully!');
      console.log('💡 Refresh your Smartsheet to see the change');
    }

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    if (error.response?.data) {
      console.error('Full error:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

addTask112();
