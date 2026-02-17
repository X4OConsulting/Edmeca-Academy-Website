#!/usr/bin/env node
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config({ path: '.env.local' });

const SMARTSHEET_API_TOKEN = process.env.SMARTSHEET_API_TOKEN;
const SHEET_ID = process.env.SMARTSHEET_SHEET_ID;

async function addToBottom() {
  try {
    console.log('🚀 Testing add to bottom without sibling...\n');

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

    // Try adding to bottom with toBottom: true
    const rowData = {
      toBottom: true,
      cells: [
        {
          columnId: columnMap['Task ID'],
          value: 1.12
        },
        {
          columnId: columnMap['Task Name'],
          value: 'CI/CD Automation Pipeline Setup'
        }
      ]
    };

    console.log('Request:', JSON.stringify(rowData, null, 2));
    console.log('\n📤 Adding single row to bottom...\n');

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

    // Verify
    console.log('\n🔍 Verifying...\n');
    
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
      console.log('Created row cells:');
      const taskIdCell = createdRow.cells.find(c => c.columnId === columnMap['Task ID']);
      const taskNameCell = createdRow.cells.find(c => c.columnId === columnMap['Task Name']);
      console.log('  Task ID:', taskIdCell);
      console.log('  Task Name:', taskNameCell);
    }

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

addToBottom();
