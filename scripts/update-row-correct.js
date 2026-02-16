#!/usr/bin/env node

/**
 * Update row using correct Smartsheet API format
 */

import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local', quiet: true });
dotenv.config({ quiet: true });

const apiToken = process.env.SMARTSHEET_API_TOKEN;
const sheetId = process.env.SMARTSHEET_SHEET_ID;

const targetRowId = 6502083164049284;

async function updateRowCorrectly() {
  console.log(`🔄 Updating row with correct format: ${targetRowId}...`);

  if (!apiToken || !sheetId) {
    console.error('❌ Missing credentials');
    process.exit(1);
  }

  try {
    // According to Smartsheet API docs, the format should be:
    const updatePayload = [
      {
        id: targetRowId,
        cells: [
          {
            columnId: 148899208318852, // Task ID
            value: 1.9
          },
          {
            columnId: 4652498835689348, // Task Name
            value: "✅ Test Smartsheet Integration Success!"
          }
        ]
      }
    ];

    console.log('📝 Update payload:', JSON.stringify(updatePayload, null, 2));

    const response = await axios.put(
      `https://api.smartsheet.com/2.0/sheets/${sheetId}/rows`,
      updatePayload,
      {
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('🎉 ROW UPDATED SUCCESSFULLY!');
    console.log('📊 Response:', JSON.stringify(response.data, null, 2));

  } catch (error) {
    console.error('❌ Error updating row:');
    console.error('Status:', error.response?.status);
    console.error('Message:', error.response?.data?.message || error.message);
    if (error.response?.data) {
      console.error('Details:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

updateRowCorrectly();