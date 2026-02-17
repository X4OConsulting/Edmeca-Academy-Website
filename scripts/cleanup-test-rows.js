#!/usr/bin/env node
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config({ path: '.env.local' });

const SMARTSHEET_API_TOKEN = process.env.SMARTSHEET_API_TOKEN;
const SHEET_ID = process.env.SMARTSHEET_SHEET_ID;

async function cleanupTestRows() {
  try {
    console.log('🧹 Cleaning up test rows...\n');

    // Get sheet
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
    const columnMap = {};
    columns.forEach(col => {
      columnMap[col.title] = col.id;
    });

    // Find the good row 13 with task 1.12
    const goodRow13 = sheet.rows.find(row => {
      const taskIdCell = row.cells.find(cell => cell.columnId === columnMap['Task ID']);
      return taskIdCell && taskIdCell.displayValue === '1.12' && row.rowNumber === 13;
    });

    console.log(`✅ Keeping row 13 (Task 1.12, Row ID: ${goodRow13.id})\n`);

    // Find all rows with rowNumber >= 73 (the test rows)
    const testRows = sheet.rows.filter(row => row.rowNumber >= 73);
    
    console.log(`Found ${testRows.length} test rows to delete:\n`);
    testRows.forEach(row => {
      const taskIdCell = row.cells.find(cell => cell.columnId === columnMap['Task ID']);
      const taskNameCell = row.cells.find(cell => cell.columnId === columnMap['Task Name']);
      console.log(`   Row ${row.rowNumber}: ${taskIdCell?.displayValue || '(empty)'} - ${taskNameCell?.displayValue || '(empty)'} (ID: ${row.id})`);
    });

    if (testRows.length === 0) {
      console.log('\n✅ No test rows to delete!');
      return;
    }

    console.log('\n🗑️  Deleting test rows...\n');

    // Delete all test rows
    const rowIdsToDelete = testRows.map(r => r.id);
    const deleteUrl = `https://api.smartsheet.com/2.0/sheets/${SHEET_ID}/rows?ids=${rowIdsToDelete.join(',')}`;
    
    const deleteResponse = await axios.delete(deleteUrl, {
      headers: {
        Authorization: `Bearer ${SMARTSHEET_API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (deleteResponse.data.message === 'SUCCESS') {
      console.log(`✅ Deleted ${deleteResponse.data.resultCode} test rows successfully!`);
      console.log('💡 Refresh your Smartsheet to see the cleaned sheet');
    }

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

cleanupTestRows();
