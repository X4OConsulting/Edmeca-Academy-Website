#!/usr/bin/env node

/**
 * List all actual Task ID values to see the format
 */

import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local', quiet: true });
dotenv.config({ quiet: true });

const apiToken = process.env.SMARTSHEET_API_TOKEN;
const sheetId = process.env.SMARTSHEET_SHEET_ID;

async function listAllTaskIds() {
  console.log('📋 Listing all Task ID values...');

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
    const taskIdColumn = sheet.columns.find(col => col.title === 'Task ID');
    
    console.log(`📌 Task ID Column: ${taskIdColumn.title} (ID: ${taskIdColumn.id})`);
    console.log(`📝 Total rows in sheet: ${sheet.rows.length}`);
    console.log('\n📋 ALL TASK ID VALUES:');

    sheet.rows.forEach((row, index) => {
      const taskIdCell = row.cells.find(cell => cell.columnId === taskIdColumn.id);
      
      console.log(`Row ${row.rowNumber} (ID: ${row.id}):`);
      console.log(`   Task ID Cell: ${JSON.stringify(taskIdCell)}`);
      
      if (taskIdCell && (taskIdCell.value || taskIdCell.displayValue)) {
        console.log(`   ✅ Value: "${taskIdCell.value}"`);
        console.log(`   ✅ Display: "${taskIdCell.displayValue}"`);
      } else {
        console.log(`   ❌ Empty cell`);
      }
      console.log('');
      
      // Only show first 10 for readability
      if (index >= 9) {
        console.log(`... and ${sheet.rows.length - 10} more rows`);
        return;
      }
    });

    // Now let me also check what permissions the sheet has
    console.log('\n🔒 SHEET PERMISSIONS:');
    console.log(`   Access Level: ${sheet.accessLevel}`);
    console.log(`   Read Only: ${sheet.readOnly || false}`);
    console.log(`   Owner: ${sheet.owner}`);
    console.log(`   Created By: ${sheet.createdBy?.name || 'Unknown'}`);
  
  } catch (error) {
    console.error('❌ Error listing Task IDs:');
    console.error('Status:', error.response?.status);
    console.error('Message:', error.response?.data?.message || error.message);
  }
}

listAllTaskIds();