#!/usr/bin/env node

/**
 * Update cells directly using the cell update API
 */

import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local', quiet: true });
dotenv.config({ quiet: true });

const apiToken = process.env.SMARTSHEET_API_TOKEN;
const sheetId = process.env.SMARTSHEET_SHEET_ID;

// Target row and columns
const targetRowId = 6502083164049284;
const taskIdColumnId = 148899208318852;
const taskNameColumnId = 4652498835689348;

async function updateCellsDirectly() {
  console.log(`🎯 Updating cells directly in row: ${targetRowId}...`);

  if (!apiToken || !sheetId) {
    console.error('❌ Missing credentials');
    process.exit(1);
  }

  try {
    // Update just the task ID cell first
    const updateData = [
      {
        rowId: targetRowId,
        columnId: taskIdColumnId,
        value: 1.9
      },
      {
        rowId: targetRowId,
        columnId: taskNameColumnId,
        value: "✅ Test Smartsheet Integration - API Success!"
      }
    ];

    console.log('📝 Cell updates:', JSON.stringify(updateData, null, 2));

    const response = await axios.put(
      `https://api.smartsheet.com/2.0/sheets/${sheetId}/cells`,
      { cells: updateData },
      {
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('🎉 CELLS UPDATED SUCCESSFULLY!');
    console.log('📊 Response:', JSON.stringify(response.data, null, 2));

  } catch (error) {
    console.error('❌ Error updating cells:');
    console.error('Status:', error.response?.status);
    console.error('Message:', error.response?.data?.message || error.message);
    if (error.response?.data) {
      console.error('Details:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

updateCellsDirectly();