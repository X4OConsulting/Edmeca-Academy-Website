#!/usr/bin/env node

/**
 * Try updating the empty row instead of creating new ones
 */

import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local', quiet: true });
dotenv.config({ quiet: true });

const apiToken = process.env.SMARTSHEET_API_TOKEN;
const sheetId = process.env.SMARTSHEET_SHEET_ID;

// Use the most recent empty row
const emptyRowId = 6502083164049284;

async function updateEmptyRow() {
  console.log(`🔄 Updating empty row: ${emptyRowId}...`);

  if (!apiToken || !sheetId) {
    console.error('❌ Missing credentials');
    process.exit(1);
  }

  try {
    // Get sheet structure first
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
    
    // Get column IDs
    const taskIdColumn = sheet.columns.find(col => col.title === 'Task ID');
    const taskNameColumn = sheet.columns.find(col => col.title === 'Task Name');
    
    console.log(`📌 Task ID Column: ${taskIdColumn?.id}`);
    console.log(`📌 Task Name Column: ${taskNameColumn?.id}`);

    // Update the row
    const updateData = {
      id: emptyRowId,
      cells: [
        {
          columnId: taskIdColumn.id,
          value: 1.9  // NUMERIC value, not string!
        },
        {
          columnId: taskNameColumn.id,
          value: "Test Smartsheet Integration - Updated"
        }
      ]
    };

    console.log('📝 Update data:', JSON.stringify(updateData, null, 2));

    const response = await axios.put(
      `https://api.smartsheet.com/2.0/sheets/${sheetId}/rows`,
      {
        rows: [updateData]
      },
      {
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Row updated!');
    console.log('📊 Response:', JSON.stringify(response.data, null, 2));

  } catch (error) {
    console.error('❌ Error updating row:');
    console.error('Status:', error.response?.status);
    console.error('Message:', error.response?.data?.message || error.message);
    if (error.response?.data?.detail) {
      console.error('Details:', JSON.stringify(error.response.data.detail, null, 2));
    }
  }
}

updateEmptyRow();