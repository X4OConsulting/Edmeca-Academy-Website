#!/usr/bin/env node

/**
 * Delete the empty test row
 */

import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local', quiet: true });
dotenv.config({ quiet: true });

const apiToken = process.env.SMARTSHEET_API_TOKEN;
const sheetId = process.env.SMARTSHEET_SHEET_ID;

// The Row ID of the empty row we created
const emptyRowId = 5436792594173828;

async function deleteEmptyRow() {
  console.log(`🗑️ Deleting empty row: ${emptyRowId}...`);

  if (!apiToken || !sheetId) {
    console.error('❌ Missing credentials');
    process.exit(1);
  }

  try {
    const response = await axios.delete(
      `https://api.smartsheet.com/2.0/sheets/${sheetId}/rows?ids=${emptyRowId}&ignoreRowsNotFound=true`,
      {
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Empty row deleted successfully!');
    console.log('📊 Response:', JSON.stringify(response.data, null, 2));

  } catch (error) {
    console.error('❌ Error deleting row:');
    console.error('Status:', error.response?.status);
    console.error('Message:', error.response?.data?.message || error.message);
  }
}

deleteEmptyRow();