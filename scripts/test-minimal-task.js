#!/usr/bin/env node

/**
 * Test minimal row creation with just primary column
 */

import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local', quiet: true });
dotenv.config({ quiet: true });

const apiToken = process.env.SMARTSHEET_API_TOKEN;
const sheetId = process.env.SMARTSHEET_SHEET_ID;

async function createMinimalTask() {
  console.log('🧪 Testing minimal row creation...');

  if (!apiToken || !sheetId) {
    console.error('❌ Missing credentials');
    process.exit(1);
  }

  try {
    // Get sheet structure
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
    const taskNameColumn = sheet.columns.find(col => col.primary);
    console.log(`📌 Primary column: ${taskNameColumn.title} (ID: ${taskNameColumn.id})`);

    // Create minimal row with just primary column
    const minimalRow = {
      toBottom: true,
      cells: [
        {
          columnId: taskNameColumn.id,
          value: "🧪 API Test Task 1.9"
        }
      ]
    };

    console.log('📝 Minimal row data:', JSON.stringify(minimalRow, null, 2));

    const response = await axios.post(
      `https://api.smartsheet.com/2.0/sheets/${sheetId}/rows`,
      { rows: [minimalRow] },
      {
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Minimal task created!');
    console.log('📊 Response:', JSON.stringify(response.data, null, 2));

  } catch (error) {
    console.error('❌ Error creating minimal task:');
    console.error('Status:', error.response?.status);
    console.error('Message:', error.response?.data?.message || error.message);
    if (error.response?.data?.detail) {
      console.error('Details:', JSON.stringify(error.response.data.detail, null, 2));
    }
  }
}

createMinimalTask();