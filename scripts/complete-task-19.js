#!/usr/bin/env node

/**
 * Manually complete task 1.9 using the working update format
 */

import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local', quiet: true });
dotenv.config({ quiet: true });

const apiToken = process.env.SMARTSHEET_API_TOKEN;
const sheetId = process.env.SMARTSHEET_SHEET_ID;

async function completeTask19() {
  console.log('🎯 Manually completing task 1.9...');

  try {
    const targetRowId = 6502083164049284;
    const statusColumnId = 5778398742531972; // From the previous output
    const percentCompleteColumnId = 3526598928846724; // From earlier investigation

    // Update to Complete status and 100%
    const updatePayload = [
      {
        id: targetRowId,
        cells: [
          {
            columnId: statusColumnId,
            value: "Complete"
          },
          {
            columnId: percentCompleteColumnId,
            value: 1  // 100% as decimal
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

    console.log('🎉 TASK 1.9 MARKED COMPLETE!');
    console.log('📊 Response:', JSON.stringify(response.data, null, 2));

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response?.data) {
      console.error('Details:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

completeTask19();